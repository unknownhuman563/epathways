<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;

/**
 * Client-facing Leads Portal — scoped to the lead-role user's own Lead
 * record. The portal middleware ('portal:lead') enforces role; this
 * controller enforces record-level scope (`$user->lead`).
 */
class LeadPortalController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();
        $lead = $user?->lead;

        if (! $lead) {
            // Defensive: a role='lead' user should always have a linked Lead.
            // If they don't, log out and bounce to login.
            Auth::logout();
            return redirect('/login')->withErrors(['email' => 'Portal account is not linked to a lead record. Please contact ePathways.']);
        }

        return inertia('portal/lead/Dashboard', [
            'lead' => [
                'lead_id'           => $lead->lead_id,
                'first_name'        => $lead->first_name,
                'last_name'         => $lead->last_name,
                'email'             => $lead->email,
                'phone'             => $lead->phone,
                'residence_country' => $lead->residence_country,
                'stage'             => $lead->stage,
                'status'            => $lead->status,
                'created_at'        => $lead->created_at,
            ],
        ]);
    }
}
