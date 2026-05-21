<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreQuickLeadRequest;
use App\Services\LeadIntakeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Lightweight lead capture for inline quick-lead forms (hero, exit-intent,
 * fee-guide download, etc.). All dedupe + activity-on-resubmit logic now
 * lives in LeadIntakeService so every public form behaves consistently.
 */
class QuickLeadController extends Controller
{
    public function store(StoreQuickLeadRequest $request, LeadIntakeService $intake)
    {
        $validated = $request->validated();

        // Split "Full Name" into first/last for the existing leads schema.
        $parts     = preg_split('/\s+/', trim($validated['name']), 2);
        $firstName = $parts[0];
        $lastName  = $parts[1] ?? '';

        $formType = 'quick-lead:' . ($validated['source'] ?? 'general');

        try {
            $lead = $intake->ingest($formType, [
                'lead_id'    => 'QL-' . strtoupper(uniqid()),
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'email'      => $validated['email'],
                'phone'      => $validated['phone'],
                'stage'      => 'Quick-Lead',
            ], $request);

            return redirect()->back()->with([
                'success'       => "Thanks {$firstName} — our team will reach out within 24 hours.",
                'quick_lead_ok' => true,
                'lead_id'       => $lead->lead_id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Quick lead capture failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withErrors([
                'error' => 'Something went wrong on our end. Please try again or message us on WhatsApp.',
            ])->withInput();
        }
    }
}
