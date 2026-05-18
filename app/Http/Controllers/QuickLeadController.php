<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreQuickLeadRequest;
use App\Models\Lead;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Lightweight lead capture for inline quick-lead forms (hero, exit-intent,
 * fee-guide download, etc.). Intentionally narrow — name/email/phone only —
 * to keep friction low. Writes into the same `leads` table as the full free
 * assessment so sales sees both pipelines in one place; the `source` column
 * distinguishes entry points.
 */
class QuickLeadController extends Controller
{
    public function store(StoreQuickLeadRequest $request)
    {
        $validated = $request->validated();

        // Split "Full Name" into first/last for the existing leads schema.
        $parts = preg_split('/\s+/', trim($validated['name']), 2);
        $firstName = $parts[0];
        $lastName  = $parts[1] ?? '';

        try {
            DB::beginTransaction();

            // Dedupe by email to avoid spamming sales with the same person.
            // If the email already belongs to a full assessment, leave its
            // stage/source untouched so we don't downgrade a hotter lead.
            $existing = Lead::where('email', $validated['email'])->first();

            if ($existing) {
                $existing->update([
                    'first_name' => $existing->first_name ?: $firstName,
                    'last_name'  => $existing->last_name ?: $lastName,
                    'phone'      => $existing->phone ?: $validated['phone'],
                ]);
                $lead = $existing;
            } else {
                $lead = Lead::create([
                    'lead_id'    => 'QL-' . strtoupper(uniqid()),
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                    'email'      => $validated['email'],
                    'phone'      => $validated['phone'],
                    'status'     => 'New',
                    'stage'      => 'Quick-Lead',
                    'source'     => $validated['source'],
                    'financial_info' => [
                        // Lightweight metadata blob — we keep the interest tag
                        // here rather than adding another column.
                        'quick_lead' => [
                            'interest'   => $validated['interest'] ?? 'General',
                            'captured_at' => now()->toIso8601String(),
                            'source'     => $validated['source'],
                        ],
                    ],
                ]);
            }

            DB::commit();

            return redirect()->back()->with([
                'success'        => "Thanks {$firstName} — our team will reach out within 24 hours.",
                'quick_lead_ok'  => true,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Quick lead capture failed', ['error' => $e->getMessage()]);

            return redirect()->back()->withErrors([
                'error' => 'Something went wrong on our end. Please try again or message us on WhatsApp.',
            ])->withInput();
        }
    }
}
