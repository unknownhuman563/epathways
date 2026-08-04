<?php

namespace App\Services\Immigration;

use App\Models\CaseFinding;
use App\Models\CaseFindingRun;
use App\Models\Lead;
use App\Services\Immigration\Findings\Rules\ChecklistItemMissingRule;
use App\Services\Immigration\Findings\Rules\DocumentRejectedRule;
use App\Services\Immigration\Findings\Rules\DocumentRequestUnansweredRule;
use App\Services\Immigration\Findings\Rules\EngagementWithoutInvoiceRule;
use App\Services\Immigration\Findings\Rules\InvoiceOverdueRule;
use App\Services\Immigration\Findings\Rules\NoClientContactRule;
use App\Services\Immigration\Findings\Rules\PassportExpiringRule;
use App\Services\Immigration\Findings\Rules\UnresolvedThreadRule;
use Illuminate\Support\Facades\DB;

/**
 * Build 12 phase 3 — case assist (rules only). Runs every rule against a case,
 * then reconciles the shared findings list:
 *
 *   - a recurring finding updates last_seen_at (dedup on finding_key), never a
 *     duplicate row;
 *   - an open finding a rule no longer emits is auto-resolved (status=actioned),
 *     not deleted;
 *   - a dismissed finding stays dismissed — the dismissal persists even if the
 *     rule fires again — so tuning can be measured by dismissal rate.
 *
 * Every finding names the specific thing and carries evidence; the rules source
 * those from CaseChecklistService and the record, never inventing them.
 *
 * This runs QUEUED (see EvaluateCaseFindings), on document upload / stage change
 * / nightly — never on page load. The panel renders the last stored result.
 */
class CaseFindingService
{
    /** @return array<int, class-string> one small class per rule (§8a). */
    private function ruleClasses(): array
    {
        return [
            ChecklistItemMissingRule::class,
            DocumentRejectedRule::class,
            PassportExpiringRule::class,
            DocumentRequestUnansweredRule::class,
            NoClientContactRule::class,
            InvoiceOverdueRule::class,
            UnresolvedThreadRule::class,
            EngagementWithoutInvoiceRule::class,
        ];
    }

    /**
     * Evaluate one case and reconcile its findings. Returns a small summary.
     *
     * @return array{open: int, couldnt_verify: array<int, string>}
     */
    public function evaluate(Lead $lead): array
    {
        $emitted = [];
        $couldntVerify = [];

        foreach ($this->ruleClasses() as $class) {
            $result = app($class)->evaluate($lead);
            foreach ($result->findings as $f) {
                $emitted[$f['finding_key']] = $f;
            }
            foreach ($result->couldntVerify as $note) {
                $couldntVerify[] = $note;
            }
        }

        DB::transaction(function () use ($lead, $emitted, $couldntVerify) {
            $now = now();

            foreach ($emitted as $key => $f) {
                $existing = CaseFinding::where('lead_id', $lead->id)
                    ->where('finding_key', $key)
                    ->first();

                // A dismissed finding stays dismissed even if it recurs — respect
                // the human decision; only refresh when it was last seen.
                if ($existing && $existing->status === CaseFinding::STATUS_DISMISSED) {
                    $existing->forceFill(['last_seen_at' => $now])->save();

                    continue;
                }

                CaseFinding::updateOrCreate(
                    ['lead_id' => $lead->id, 'finding_key' => $key],
                    [
                        'category' => $f['category'] ?? null,
                        'severity' => $f['severity'] ?? 'check',
                        'title' => $f['title'],
                        'detail' => $f['detail'] ?? null,
                        'evidence' => $f['evidence'] ?? [],
                        'source' => 'rule',
                        'audience' => $f['audience'] ?? 'staff',
                        // Reopen an auto-resolved finding that has recurred.
                        'status' => CaseFinding::STATUS_OPEN,
                        'actioned_by' => null,
                        'actioned_at' => null,
                        'last_seen_at' => $now,
                        'first_seen_at' => $existing->first_seen_at ?? $now,
                    ],
                );
            }

            // Auto-resolve rule findings that no longer fire — the underlying
            // issue cleared (e.g. the document was uploaded). Never delete.
            CaseFinding::where('lead_id', $lead->id)
                ->where('source', 'rule')
                ->where('status', CaseFinding::STATUS_OPEN)
                ->when(! empty($emitted), fn ($q) => $q->whereNotIn('finding_key', array_keys($emitted)))
                ->update(['status' => CaseFinding::STATUS_ACTIONED, 'actioned_at' => $now]);

            CaseFindingRun::updateOrCreate(
                ['lead_id' => $lead->id],
                ['evaluated_at' => $now, 'couldnt_verify' => array_values($couldntVerify)],
            );
        });

        return [
            'open' => count($emitted),
            'couldnt_verify' => array_values($couldntVerify),
        ];
    }
}
