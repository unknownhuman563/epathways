<?php

namespace App\Http\Controllers;

use App\Models\Concern;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ConcernController extends Controller
{
    /** Public concern form. */
    public function form()
    {
        return inertia('accommodation/Concern', [
            'properties' => $this->propertyOptions(),
        ]);
    }

    /**
     * Public submit. The property is taken from the (required) dropdown, so the
     * portal always knows which house — even if the email has a typo. The email
     * is additionally matched to a tenant to label the concern with their name.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'property_id' => ['required', 'integer', Rule::exists('accommodation_properties', 'id')->where('is_active', true)],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        // Best-effort: link the tenant by email (prefer in-residence) for their name.
        $tenant = Tenant::whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])
            ->orderByRaw("CASE WHEN current_status IN ('active','notice_given','vacating') THEN 0 ELSE 1 END")
            ->latest('id')
            ->first();

        Concern::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'message' => $data['message'],
            'property_id' => $data['property_id'], // authoritative — from the dropdown
            'tenant_id' => $tenant?->id,
        ]);

        return redirect()->route('accommodation.concern')
            ->with('success', 'Thanks — your concern has been submitted. Our team will be in touch.');
    }

    /** Portal list (route is behind portal:accommodation). */
    public function index()
    {
        $concerns = Concern::with(['tenant', 'property', 'assignedTo'])
            ->latest()
            ->get()
            ->map(fn (Concern $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'email' => $c->email,
                'message' => $c->message,
                'created_at' => $c->created_at?->toIso8601String(),
                'tenant_name' => $c->tenant?->display_name,
                'property_address' => $c->property ? ($c->property->address ?: $c->property->name) : null,
                'property_code' => $c->property?->code,
                'status' => $c->status,
                'assigned_to_user_id' => $c->assigned_to_user_id,
            ]);

        return inertia('portal/accommodation/Concerns', [
            'concerns' => $concerns,
            'statuses' => Concern::STATUSES,
            'team' => $this->teamOptions(),
        ]);
    }

    /** Staff update — set the status and/or assignee. */
    public function update(Request $request, Concern $concern)
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Concern::STATUSES)],
            'assigned_to_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
        ]);

        $concern->update($data);

        return redirect()->back();
    }

    /** Active properties for the public dropdown. */
    private function propertyOptions(): array
    {
        return Property::where('is_active', true)
            ->orderByRaw('code IS NULL, CAST(code AS UNSIGNED)')
            ->get()
            ->map(fn (Property $p) => [
                'id' => $p->id,
                'label' => trim(($p->code ? "#{$p->code} · " : '').($p->address ?: $p->name)),
            ])
            ->all();
    }

    /** Accommodation team for the assignee dropdown. */
    private function teamOptions(): array
    {
        return User::whereIn('role', ['accommodation', 'admin'])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->all();
    }
}
