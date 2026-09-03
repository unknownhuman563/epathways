<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\User;
use App\Notifications\LeadAssignedToYou;
use Illuminate\Support\Facades\Auth;

/**
 * Fires assignment notifications when a lead's owner changes. Using an
 * observer (rather than dispatching from each controller) means the
 * notification fires no matter where the assignment happens, and keeps
 * the wiring in one place.
 */
class LeadObserver
{
    /**
     * Immigration stages from "Visa Lodged" onward — reaching any of them means
     * the application is with INZ. (Withdrawn is excluded — a case can be
     * withdrawn before it is ever lodged.)
     */
    private const LODGED_STAGES = [
        'Visa Lodged', 'Interim Visa Issued', 'Request for Information',
        'RFI Responded', 'Approved in Principle', 'Approved Visa', 'Decline Visa',
    ];

    /**
     * Auto-stamp the INZ lodgement date the first time a case reaches a lodged
     * stage, so the processing tracker works the moment staff advance the stage —
     * no separate manual entry needed. Runs before the write (all stage-change
     * paths funnel through save), only on the stage transition, and never over an
     * existing date, so staff can still correct it afterwards.
     */
    public function saving(Lead $lead): void
    {
        if ($lead->isDirty('immigration_stage')
            && in_array($lead->immigration_stage, self::LODGED_STAGES, true)
            && empty($lead->inz_lodged_at)) {
            $lead->inz_lodged_at = now();
        }
    }

    public function updated(Lead $lead): void
    {
        // Only when assigned_to actually changed in this save, and only on
        // assignment (not un-assignment to null).
        if (! $lead->wasChanged('assigned_to') || $lead->assigned_to === null) {
            return;
        }

        $assignee = User::find($lead->assigned_to);
        if (! $assignee) {
            return;
        }

        $actor = Auth::user();
        $assignee->notify(new LeadAssignedToYou(
            $lead,
            $actor?->id,
            $actor?->name ?? 'System',
        ));
    }
}
