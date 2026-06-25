<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\Tenant;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    /** Public complaint form. */
    public function form()
    {
        return inertia('accommodation/Complaint');
    }

    /** Public submit — matches the email to a tenant + their property. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        // Match the email to a tenant, preferring an in-residence one, so the
        // portal can show which property the complaint is about.
        $tenant = Tenant::whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])
            ->orderByRaw("CASE WHEN current_status IN ('active','notice_given','vacating') THEN 0 ELSE 1 END")
            ->latest('id')
            ->first();

        Complaint::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
            'tenant_id' => $tenant?->id,
            'property_id' => $tenant?->property_id,
        ]);

        return redirect()->route('accommodation.complaint')
            ->with('success', 'Thanks — your complaint has been submitted. Our team will be in touch.');
    }

    /** Portal list (route is behind portal:accommodation). */
    public function index()
    {
        $complaints = Complaint::with(['tenant', 'property'])
            ->latest()
            ->get()
            ->map(fn (Complaint $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'message' => $c->message,
                'created_at' => $c->created_at?->toIso8601String(),
                'tenant_name' => $c->tenant?->display_name,
                'property_address' => $c->property ? ($c->property->address ?: $c->property->name) : null,
                'property_code' => $c->property?->code,
            ]);

        return inertia('portal/accommodation/Complaints', [
            'complaints' => $complaints,
        ]);
    }
}
