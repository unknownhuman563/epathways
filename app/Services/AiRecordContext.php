<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\LeadDocument;

/**
 * Builds a compact, FACTUAL, read-only briefing about one record (a Lead —
 * which covers leads, students and immigration cases) for the AI assistant.
 *
 * Everything here comes straight from the record. The assistant is told to
 * answer only from this briefing and to say "not on file" for anything
 * absent — so it can't invent client details.
 */
class AiRecordContext
{
    /**
     * @return array{label: string, is_immigration: bool, text: string}
     */
    public static function for(Lead $lead): array
    {
        $lead->loadMissing(['assignee:id,name']);

        $name = trim("{$lead->first_name} {$lead->last_name}") ?: 'Unknown';
        $isImmigration = (bool) $lead->is_immigration_case;
        $kind = $isImmigration ? 'immigration case' : ($lead->is_student ? 'student' : 'lead');

        $lines = [];
        $lines[] = "RECORD BRIEFING — {$kind}";
        $lines[] = "Name: {$name}";
        $lines[] = 'Reference: '.($lead->lead_id ?: 'n/a');
        $lines[] = 'Email: '.($lead->email ?: 'not on file');
        $lines[] = 'Phone: '.($lead->phone ?: 'not on file');
        $lines[] = 'Country: '.($lead->residence_country ?: 'not on file');
        if (! blank($lead->age)) {
            $lines[] = "Age: {$lead->age}";
        }
        $lines[] = 'Current stage: '.($lead->stage ?: 'not set');
        $lines[] = 'Status: '.($lead->status ?: 'not set');
        $lines[] = 'Assigned to: '.($lead->assignee->name ?? 'unassigned');
        if ($isImmigration && filled($lead->current_nz_visa_type ?? null)) {
            $lines[] = "Current NZ visa: {$lead->current_nz_visa_type}";
        }
        $lines[] = 'Created: '.optional($lead->created_at)->toDayDateTimeString();

        // Document / checklist state — counts by status (factual).
        $docs = $lead->documents()
            ->selectRaw('status, count(*) c')
            ->groupBy('status')
            ->pluck('c', 'status');
        if ($docs->isNotEmpty()) {
            $parts = $docs->map(fn ($c, $s) => "{$c} {$s}")->values()->all();
            $lines[] = 'Documents: '.implode(', ', $parts);
            $outstanding = (int) ($docs[LeadDocument::STATUS_SUBMITTED] ?? 0)
                + (int) ($docs[LeadDocument::STATUS_UNDER_REVIEW] ?? 0);
            if ($outstanding > 0) {
                $lines[] = "Documents awaiting staff review: {$outstanding}";
            }
        } else {
            $lines[] = 'Documents: none uploaded yet';
        }

        // Latest notes (most recent 3) — internal staff notes, factual context.
        $notes = $lead->notes()->latest()->take(3)->get(['body', 'created_at']);
        if ($notes->isNotEmpty()) {
            $lines[] = 'Recent internal notes:';
            foreach ($notes as $n) {
                $when = optional($n->created_at)->toDateString();
                $body = str()->limit(trim((string) $n->body), 180);
                $lines[] = "  - [{$when}] {$body}";
            }
        }

        // Open tasks count.
        $openTasks = $lead->tasks()->where('completed', false)->count();
        if ($openTasks > 0) {
            $lines[] = "Open tasks on this record: {$openTasks}";
        }

        return [
            'label' => "{$name} ({$kind})",
            'is_immigration' => $isImmigration,
            'text' => implode("\n", $lines),
        ];
    }
}
