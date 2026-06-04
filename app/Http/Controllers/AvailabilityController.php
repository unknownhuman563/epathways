<?php

namespace App\Http\Controllers;

use App\Models\AvailabilityRule;
use App\Models\User;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function index()
    {
        $rules = AvailabilityRule::query()
            ->with('user:id,name,email')
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        return inertia('admin/Availability', [
            'rules' => $rules,
            'staff' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
            'days'  => AvailabilityRule::DAYS,
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        AvailabilityRule::create($data);
        return back()->with('success', 'Availability rule created.');
    }

    public function update(Request $request, $id)
    {
        $rule = AvailabilityRule::findOrFail($id);
        $data = $this->validated($request);
        $rule->update($data);
        return back()->with('success', 'Availability rule updated.');
    }

    public function destroy($id)
    {
        AvailabilityRule::findOrFail($id)->delete();
        return back()->with('success', 'Availability rule deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'day_of_week'  => 'required|integer|between:0,6',
            'start_time'   => ['required', 'regex:/^\d{2}:\d{2}$/'],
            'end_time'     => ['required', 'regex:/^\d{2}:\d{2}$/', 'gt:start_time'],
            'slot_minutes' => 'required|integer|in:15,30,45,60,90,120',
            'user_id'      => 'nullable|exists:users,id',
            'active'       => 'boolean',
            'label'        => 'nullable|string|max:120',
        ]);
    }
}
