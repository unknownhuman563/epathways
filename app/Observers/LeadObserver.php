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
