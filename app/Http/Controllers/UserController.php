<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** admin + every department-portal role. */
    private function roleValues(): array
    {
        return array_merge([User::ROLE_ADMIN], User::PORTAL_ROLES);
    }

    public function index()
    {
        $users = User::orderBy('name')->get(['id', 'name', 'email', 'role', 'created_at']);

        return inertia('admin/Users', [
            'users' => $users,
            'roles' => $this->roleValues(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in($this->roleValues())],
            'password' => 'required|string|min:8',
        ]);

        // The 'password' => 'hashed' cast on the model hashes this on save.
        $user = User::create($validated);

        ActivityLog::record('user.created', [
            'description' => "Created user {$user->name} ({$user->email}) — {$user->role}",
            'properties' => ['target_id' => $user->id, 'target_email' => $user->email, 'target_role' => $user->role],
        ]);

        return back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'role' => ['required', Rule::in($this->roleValues())],
            'password' => 'nullable|string|min:8',
        ]);

        // Don't let the current admin demote themselves — avoids locking yourself out.
        if ($user->is($request->user()) && $validated['role'] !== User::ROLE_ADMIN) {
            return back()->withErrors(['role' => 'You cannot change your own role.']);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];
        $passwordChanged = ! empty($validated['password']);
        if ($passwordChanged) {
            $user->password = $validated['password'];
        }
        $changed = array_keys($user->getDirty());
        $user->save();

        ActivityLog::record('user.updated', [
            'description' => "Updated user {$user->name} ({$user->email})".($passwordChanged ? ' — password reset' : ''),
            'properties' => ['target_id' => $user->id, 'target_email' => $user->email, 'target_role' => $user->role, 'changed' => $changed],
        ]);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->is($request->user())) {
            return back()->withErrors(['user' => 'You cannot delete your own account.']);
        }

        $snapshot = ['target_id' => $user->id, 'target_name' => $user->name, 'target_email' => $user->email, 'target_role' => $user->role];

        $user->delete();

        ActivityLog::record('user.deleted', [
            'description' => "Deleted user {$snapshot['target_name']} ({$snapshot['target_email']})",
            'properties' => $snapshot,
        ]);

        return back()->with('success', 'User deleted successfully.');
    }
}
