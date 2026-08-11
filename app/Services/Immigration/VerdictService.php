<?php

namespace App\Services\Immigration;

use App\Exceptions\AdviceGateException;
use App\Models\CaseAttestation;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

/**
 * Build 12 phase 5 — the sole writer of case_attestations (verdict + lodgement
 * sign-off). Every write passes the licence gate here, with no exceptions, so
 * an unlicensed or lapsed user can never create a row (§15.2). Append-only.
 *
 * The verdict is the adviser's attestation; the case's *movement* is a
 * consequence of it (§6), performed through the step chain — the adviser never
 * writes the stage directly:
 *   - good_to_go       → the chain advances (custody moves + notifies)
 *   - needs_something  → the relevant step re-opens as a new attempt (fresh
 *                        due_at; custody returns to that step's owner)
 *   - cannot_endorse   → the case holds; CannotEndorseRule surfaces a blocking
 *                        finding on the next evaluation
 */
class VerdictService
{
    public function __construct(private CaseStepService $steps) {}

    public function recordVerdict(Lead $lead, string $verdict, ?string $reason, User $adviser, ?string $stepKey = null): CaseAttestation
    {
        $this->assertLicensed($adviser);

        if (! in_array($verdict, CaseAttestation::VERDICTS, true)) {
            abort(422, 'Unknown verdict.');
        }
        // Reason required for anything but the first (good_to_go).
        if ($verdict !== CaseAttestation::VERDICT_GOOD_TO_GO && blank($reason)) {
            abort(422, 'A reason is required for this verdict.');
        }

        $attestation = CaseAttestation::create([
            'lead_id' => $lead->id,
            'adviser_id' => $adviser->id,
            'type' => CaseAttestation::TYPE_VERDICT,
            'verdict' => $verdict,
            'reason' => $reason,
            // Append-only: a changed verdict supersedes the previous one.
            'supersedes_id' => CaseAttestation::currentVerdict($lead->id)?->id,
        ]);

        match ($verdict) {
            CaseAttestation::VERDICT_GOOD_TO_GO => $this->onGoodToGo($lead),
            CaseAttestation::VERDICT_NEEDS_SOMETHING => $this->onNeedsSomething($lead, $stepKey, $reason),
            CaseAttestation::VERDICT_CANNOT_ENDORSE => null, // hold; CannotEndorseRule surfaces the block
            default => null,
        };

        return $attestation;
    }

    public function recordLodgementSignoff(Lead $lead, User $adviser, ?string $reason = null): CaseAttestation
    {
        $this->assertLicensed($adviser);

        $attestation = CaseAttestation::create([
            'lead_id' => $lead->id,
            'adviser_id' => $adviser->id,
            'type' => CaseAttestation::TYPE_LODGEMENT_SIGNOFF,
            'reason' => $reason,
        ]);

        // Step 12's completion DERIVES from the sign-off existing — the sign-off
        // is the write, the step going done is the consequence. complete() now
        // finds the attestation and allows it.
        $this->steps->complete($lead, '12', $adviser);

        return $attestation;
    }

    /** good_to_go — let the case proceed; the chain moves it (and custody). */
    private function onGoodToGo(Lead $lead): void
    {
        $this->steps->advance($lead);
        $this->steps->deriveStage($lead);
    }

    /** needs_something — bounce the named step back as a fresh attempt. */
    private function onNeedsSomething(Lead $lead, ?string $stepKey, ?string $reason): void
    {
        if (! $stepKey) {
            abort(422, 'needs_something requires the step to send back to.');
        }
        // reactivate() gives a fresh due_at and returns custody to that step's
        // owner (with notification), per §6 + §15.8.
        $this->steps->reactivate($lead, $stepKey, 'verdict_needs_something', $reason);
    }

    private function assertLicensed(User $adviser): void
    {
        if (! Gate::forUser($adviser)->allows('approve-advice-bearing')) {
            throw new AdviceGateException;
        }
    }
}
