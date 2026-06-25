<?php

namespace App\Services;

use App\Models\AiRecordAnalysis;
use App\Models\Lead;
use App\Models\User;
use App\Notifications\AiCriticalLeadAlert;
use Illuminate\Support\Facades\Notification;

/**
 * Produces (and caches) an AI "health" read on a Lead — Hot / Warm / Cold /
 * Critical with a one-line rationale, flags, and recommended next actions.
 * Results are cached for config('ai.analysis_cache_hours') so opening a lead
 * repeatedly doesn't re-bill the model. Critical reads raise a notification.
 */
class LeadAnalysisService
{
    public function __construct(protected AIService $ai) {}

    public function analyze(Lead $lead, bool $forceRefresh = false): AiRecordAnalysis
    {
        if (! $forceRefresh) {
            $cached = AiRecordAnalysis::query()
                ->where('record_type', Lead::class)
                ->where('record_id', $lead->id)
                ->where('expires_at', '>', now())
                ->latest('analyzed_at')
                ->first();

            if ($cached) {
                return $cached;
            }
        }

        $result = $this->ai->chat([
            ['role' => 'system', 'content' => $this->getAnalysisSystemPrompt()],
            ['role' => 'user',   'content' => $this->buildLeadAnalysisPrompt($lead)],
        ]);

        $parsed = $this->parseAnalysisResponse($result['content'] ?? '');

        $analysis = AiRecordAnalysis::create([
            'record_type'     => Lead::class,
            'record_id'       => $lead->id,
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
            $this->notifyCritical($lead, $analysis);
        }

        return $analysis;
    }

    protected function getAnalysisSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an analyst for the ePathways CRM. Given a lead's data, analyze:
- Engagement level (has the lead been seen / responded recently?)
- Information completeness (do we have name, contact, email, intent?)
- Time-sensitivity (how long since last touch? are deadlines approaching?)
- Quality signals (is this a real prospect or a tire-kicker?)

Respond with VALID JSON ONLY (no markdown, no commentary). Schema:
{
  "health": "hot" | "warm" | "cold" | "critical" | "unknown",
  "summary": "1-2 sentence plain-English assessment",
  "flags": ["overdue_followup", "missing_documents", "low_engagement"],
  "recommendations": ["Send follow-up email", "Call within 24h"],
  "score": 0-100
}

Health definitions:
- hot: actively engaged, ready to convert
- warm: shown interest, needs follow-up
- cold: low engagement or stale
- critical: needs immediate staff attention (about to be lost, deadline imminent, etc.)
- unknown: insufficient data to assess

Be concise. Plain English. No emojis. No hallucination — if data is sparse, say so.
PROMPT;
    }

    protected function buildLeadAnalysisPrompt(Lead $lead): string
    {
        $recentNotes = $lead->notes()
            ->latest()
            ->limit(5)
            ->pluck('body')
            ->map(fn ($b) => str()->limit((string) $b, 200))
            ->all();

        $data = [
            'name'         => trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? '')),
            'email'        => $lead->email,
            'phone'        => $lead->phone,
            'department'   => $this->leadDepartment($lead),
            'status'       => $lead->status,
            'stage'        => $lead->stage,
            'source'       => $lead->source,
            'created_at'   => $lead->created_at?->toDateString(),
            'updated_at'   => $lead->updated_at?->toDateString(),
            'last_seen_at' => $lead->last_seen_at?->toDateString(),
            'assigned_to'  => $lead->assignee?->name,
            'recent_notes' => $recentNotes,
        ];

        return "Analyze this lead:\n\n" . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }

    /** Plain-English department label derived from the lead's polymorphic flags. */
    protected function leadDepartment(Lead $lead): string
    {
        return match (true) {
            $lead->is_immigration_case     => 'immigration',
            $lead->is_student              => 'education',
            $lead->is_english_student      => 'english',
            $lead->is_accommodation_client => 'accommodation',
            default                        => 'sales (pipeline)',
        };
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

    protected function notifyCritical(Lead $lead, AiRecordAnalysis $analysis): void
    {
        // Prefer the assigned staffer; fall back to admins/super-admins so a
        // critical, unassigned lead never goes unseen.
        if ($lead->assignee) {
            $lead->assignee->notify(new AiCriticalLeadAlert($lead, $analysis));

            return;
        }

        $admins = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])->get();
        if ($admins->isNotEmpty()) {
            Notification::send($admins, new AiCriticalLeadAlert($lead, $analysis));
        }
    }
}
