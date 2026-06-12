<?php

namespace App\Services;

use App\Models\EoiSubmission;
use App\Support\OnboardingPipeline;
use Illuminate\Validation\ValidationException;

/**
 * Performs validated status transitions on an EOI submission: checks the move
 * is allowed by the pipeline, applies any stage data, stamps the relevant
 * timestamp, and saves. The EoiSubmission's LogsActivity trait records the
 * resulting status change (old → new) automatically on save.
 */
class OnboardingTransitionService
{
    /**
     * @param  array  $data  Validated stage payload (e.g. viewing_scheduled_at,
     *                       invoice_amount_nzd, declined_reason) to merge in.
     *
     * @throws ValidationException when the transition is not allowed.
     */
    public function transition(EoiSubmission $submission, string $to, array $data = []): EoiSubmission
    {
        $from = $submission->status;

        if ($from === $to) {
            return $submission;
        }

        if (! OnboardingPipeline::canTransition($from, $to)) {
            throw ValidationException::withMessages([
                'status' => "Cannot move from \"{$from}\" to \"{$to}\".",
            ]);
        }

        // Apply staff-supplied stage data (only known, fillable fields).
        if (! empty($data)) {
            $submission->fill($data);
        }

        // Stamp the now()-based timestamp for stages that have one.
        if ($column = OnboardingPipeline::AUTO_TIMESTAMP[$to] ?? null) {
            $submission->{$column} = now();
        }

        $submission->status = $to;
        $submission->save(); // updated event → activity log captures status change

        return $submission;
    }
}
