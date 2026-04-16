<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\CerebrasService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class AnalyzeLeadAssessment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    public function __construct(public Lead $lead)
    {
    }

    public function handle(CerebrasService $cerebras): void
    {
        $this->lead->update(['ai_analysis_status' => 'processing']);

        try {
            $analysis = $cerebras->analyze($this->lead);

            $this->lead->update([
                'ai_analysis' => $analysis,
                'ai_analysis_status' => 'completed',
            ]);

            Log::info('AI analysis completed', [
                'lead_id' => $this->lead->lead_id,
                'overall_score' => $analysis['overall_score'] ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error('AI analysis failed', [
                'lead_id' => $this->lead->lead_id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            if ($this->attempts() >= $this->tries) {
                $this->lead->update(['ai_analysis_status' => 'failed']);
            }

            throw $e;
        }
    }
}
