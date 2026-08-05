<?php

namespace App\Services\Immigration;

use App\Models\CaseFinding;
use App\Models\CaseFindingRun;
use App\Models\Lead;
use App\Services\Immigration\Findings\Rules\ChecklistItemMissingRule;
use App\Services\Immigration\Findings\Rules\DocumentRejectedRule;
use App\Services\Immigration\Findings\Rules\DocumentRequestUnansweredRule;
use App\Services\Immigration\Findings\Rules\EngagementWithoutInvoiceRule;
use App\Services\Immigration\Findings\Rules\FridayUpdateOverdueRule;
use App\Services\Immigration\Findings\Rules\InvoiceOverdueRule;
use App\Services\Immigration\Findings\Rules\NoClientContactRule;
use App\Services\Immigration\Findings\Rules\OverdueStepRule;
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
    /**
     * Run every rule and merge results — no persistence. Shared by evaluate()
     * (which then reconciles the stored list) and preview() (which doesn't).
     *
     * @return array{findings: array<string, array<string, mixed>>, couldntVerify: array<int, string>}
     */
    private function runRules(Lead $lead): array
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

        return ['findings' => $emitted, 'couldntVerify' => $couldntVerify];
    }

    /**
     * Non-persisting evaluation — what the rules would surface right now,
     * without touching case_findings. For the count-check preview command.
     *
     * @return array{open: int, couldnt_verify: int}
     */
    public function preview(Lead $lead): array
    {
        $result = $this->runRules($lead);

        return [
            'open' => count($result['findings']),
            'couldnt_verify' => count($result['couldntVerify']),
        ];
    }

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
            // Process-chain SLA breaches (Build 12 phase 4.5). No-ops for cases
            // not yet on the chain.
            OverdueStepRule::class,
            // The weekly Friday-update cadence (step 14).
            FridayUpdateOverdueRule::class,
        ];
    }

    /**
     * Evaluate one case and reconcile its findings. Returns a small summary.
     *
     * @return array{open: int, couldnt_verify: array<int, string>}
     */
    public function evaluate(Lead $lead): array
    {
        ['findings' => $emitted, 'couldntVerify' => $couldntVerify] = $this->runRules($lead);

        DB::transaction(function () use ($lead, $emitted, $couldntVerify) {
            $now = now();

            foreach ($emitted as $key => $f) {
                $existing = CaseFinding::where('lead_id', $lead->id)
                    ->where('finding_key', $key)
                    ->first();

                // A dismissed finding is scoped to the situation it dismissed.
                // If the stable evidence still fingerprints the same, the
                // dismissal holds (just refresh last_seen_at). If it differs —
                // a different rejected doc, a new passport expiry — the
                // situation changed, so re-open it rather than staying quiet.
                if ($existing && $existing->status === CaseFinding::STATUS_DISMISSED) {
                    $sameSituation = $existing->dismissed_fingerprint === null
                        || $existing->dismissed_fingerprint === CaseFinding::fingerprintFor($f['evidence'] ?? []);

                    if ($sameSituation) {
                        $existing->forceFill(['last_seen_at' => $now])->save();

                        continue;
                    }
                    // fall through to updateOrCreate below, which re-opens it.
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
                        // Reopen an auto-resolved (or situation-changed
                        // dismissed) finding that has recurred — a clean open.
                        'status' => CaseFinding::STATUS_OPEN,
                        'actioned_by' => null,
                        'actioned_at' => null,
                        'dismiss_reason' => null,
                        'dismissed_fingerprint' => null,
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
