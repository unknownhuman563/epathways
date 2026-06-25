<?php

namespace App\Services;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AiCriticalCaseAlert;
use Illuminate\Support\Facades\Notification;

/**
 * Procedural-health analysis for immigration cases. Mirrors
 * LeadAnalysisService but with a compliance-focused prompt that NEVER
 * predicts visa outcomes — it only flags documentary / deadline / process
 * issues a consultant should action.
 *
 * Immigration cases are Lead records (is_immigration_case = true); there is
 * no separate Case model. To avoid colliding with the lead-engagement
 * analysis stored against the same record, case analyses are keyed under a
 * distinct sentinel record_type (RECORD_TYPE) rather than Lead::class.
 */
class CaseAnalysisService
{
    /**
     * Sentinel polymorphic type. Not a real class — cases share the Lead
     * table, so this keeps case (procedural) analyses separate from lead
     * (engagement) analyses for the same record. Never resolved via
     * AiRecordAnalysis::record(); we always query by record_type + record_id.
     */
    public const RECORD_TYPE = 'immigration_case';

    public function __construct(protected AIService $ai) {}

    public function analyze(Lead $case, bool $forceRefresh = false): AiRecordAnalysis
    {
        if (! $forceRefresh) {
            $cached = AiRecordAnalysis::query()
                ->where('record_type', self::RECORD_TYPE)
                ->where('record_id', $case->id)
                ->where('expires_at', '>', now())
                ->latest('analyzed_at')
                ->first();

            if ($cached) {
                return $cached;
            }
        }

        $result = $this->ai->chat([
            ['role' => 'system', 'content' => $this->getAnalysisSystemPrompt()],
            ['role' => 'user',   'content' => $this->buildCaseAnalysisPrompt($case)],
        ]);

        $parsed = $this->parseAnalysisResponse($result['content'] ?? '');

        $analysis = AiRecordAnalysis::create([
            'record_type'     => self::RECORD_TYPE,
            'record_id'       => $case->id,
            'health'          => $this->normalizeHealth($parsed['health'] ?? null),
            'summary'         => $parsed['summary'] ?? 'Analysis unavailable — please try refreshing.',
            'flags'           => is_array($parsed['flags'] ?? null) ? $parsed['flags'] : [],
            'recommendations' => is_array($parsed['recommendations'] ?? null) ? $parsed['recommendations'] : [],
            'score'           => isset($parsed['score']) ? (int) $parsed['score'] : null,
            'model_used'      => $result['model'] ?? null,
            'tokens_used'     => $result['tokens'] ?? null,
            'analyzed_at'     => now(),
            'expires_at'      => now()->addHours((int) config('ai.analysis_cache_hours', 24)),
        ]);

        if ($analysis->isCritical()) {
            $this->notifyCritical($case, $analysis);
        }

        return $analysis;
    }

    protected function getAnalysisSystemPrompt(): string
    {
        return <<<'PROMPT'
You are a compliance analyst for the ePathways CRM, reviewing an immigration case.

You assess procedural health — NOT visa outcome. Never predict whether a visa will be approved or denied. Never give legal advice. You only flag procedural and documentary issues that a consultant should address.

Given the case data, evaluate:
- Document status (expiring soon? missing? out of date?)
- Deadline adherence (application due dates, response windows, RFI deadlines)
- Communication freshness (when was the consultant last in touch with the applicant?)
- Procedural flags (missing forms, unsigned documents, biometric appointments not booked)

Respond with VALID JSON ONLY (no markdown). Schema:
{
  "health": "hot" | "warm" | "cold" | "critical" | "unknown",
  "summary": "1-2 sentence procedural assessment in plain English",
  "flags": ["expiring_police_certificate", "missed_rfi_deadline", "missing_biometrics"],
  "recommendations": ["Action 1", "Action 2"],
  "score": 0-100
}

Health definitions for cases:
- hot: case progressing well, consultant on top of things
- warm: needs attention but no immediate issue
- cold: stale, consultant hasn't engaged recently
- critical: procedural issue requiring immediate consultant action (expiring doc, missed deadline, INZ-pending response)
- unknown: insufficient case data

NEVER state or imply visa eligibility, approval likelihood, or legal advice. Stick to procedural compliance only.
PROMPT;
    }

    protected function buildCaseAnalysisPrompt(Lead $case): string
    {
        $documents = $case->documents()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($d) => [
                'type'        => $d->checklist_key,
                'status'      => $d->status,
                'uploaded_at' => $d->created_at?->toDateString(),
                'reviewed_at' => $d->reviewed_at?->toDateString(),
            ])
            ->all();

        $recentNotes = $case->notes()
            ->latest()
            ->limit(5)
            ->pluck('body')
            ->map(fn ($b) => str()->limit((string) $b, 200))
            ->all();

        $data = [
            'case_reference'          => $case->inz_reference ?: ('LEAD-' . $case->id),
            'applicant_name'          => trim(($case->first_name ?? '') . ' ' . ($case->last_name ?? '')),
            'visa_type'               => $case->inz_visa_type,
            'immigration_stage'       => $case->immigration_stage,
            'inz_status'              => $case->inz_status,
            'pipeline_status'         => $case->status,
            'lodged_at'               => $case->inz_lodged_at?->toDateString(),
            'decision_at'             => $case->inz_decision_at?->toDateString(),
            'last_consultant_action'  => $case->stage_updated_at?->toDateString(),
            'passport_expiry'         => $case->passport_expiry?->toDateString(),
            'current_visa_expiry'     => $case->current_nz_visa_expiry_date?->toDateString(),
            'documents'               => $documents,
            'recent_notes'            => $recentNotes,
        ];

        return "Analyze this immigration case:\n\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    protected function parseAnalysisResponse(string $raw): array
    {
        $trimmed = trim($raw);
        if ($trimmed === '') {
            return [];
        }

        // Strip ```json … ``` fences if the model wrapped its reply.
        if (preg_match('/```(?:json)?\s*(.+?)\s*```/s', $trimmed, $m)) {
            $trimmed = trim($m[1]);
        } else {
            // Otherwise slice from the first { to the last } to drop any prose.
            $start = strpos($trimmed, '{');
            $end   = strrpos($trimmed, '}');
            if ($start !== false && $end !== false && $end > $start) {
                $trimmed = substr($trimmed, $start, $end - $start + 1);
            }
        }

        $decoded = json_decode($trimmed, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function normalizeHealth(?string $health): string
    {
        $health = strtolower(trim((string) $health));

        return in_array($health, ['hot', 'warm', 'cold', 'critical', 'unknown'], true)
            ? $health
            : 'unknown';
    }

    protected function notifyCritical(Lead $case, AiRecordAnalysis $analysis): void
    {
        // Prefer the assigned consultant; fall back to admins/super-admins so a
        // critical, unassigned case never goes unseen.
        if ($case->assignee) {
            $case->assignee->notify(new AiCriticalCaseAlert($case, $analysis));

            return;
        }

        $admins = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])->get();
        if ($admins->isNotEmpty()) {
            Notification::send($admins, new AiCriticalCaseAlert($case, $analysis));
        }
    }
}
