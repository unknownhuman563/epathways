<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\User;
use App\Support\UploadValidation;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** super-admin + admin + every department-portal role. */
    private function roleValues(): array
    {
        return array_merge([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN], User::PORTAL_ROLES);
    }

    public function index()
    {
        // Organization tab is staff only — external Lead Portal accounts
        // ('lead' / 'revoked_lead') belong on the Leads tab, not in the
        // staff directory.
        $users = User::whereNotIn('role', ['lead', 'revoked_lead'])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'avatar_path', 'created_at']);

        // Cross-link rolls for the User Management tabs. Each list is a
        // thin name + email + stage projection that the frontend renders
        // into a sortable table with a drill-in link to /admin/leads/{id}.
        // Capped at 500 rows per tab; if a tenant outgrows that, we'll
        // switch to paginated partial reloads per tab.
        $leadCols = ['id', 'lead_id', 'first_name', 'last_name', 'email', 'phone', 'stage', 'status', 'created_at'];

        $leads = \App\Models\Lead::inLeadPipeline()
            ->orderByDesc('created_at')
            ->limit(500)
            ->get($leadCols);

        $students = \App\Models\Lead::where('is_student', true)
            ->orderByDesc('created_at')
            ->limit(500)
            ->get(array_merge($leadCols, ['education_stage', 'english_stage', 'student_converted_at']));

        $cases = \App\Models\Lead::immigrationCase()
            ->orderByDesc('created_at')
            ->limit(500)
            ->get(array_merge($leadCols, ['immigration_stage', 'inz_visa_type', 'immigration_converted_at']));

        return inertia('admin/Users', [
            'users' => $users,
            'roles' => $this->roleValues(),
            'leads' => $leads,
            'students' => $students,
            'cases' => $cases,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'role' => ['required', Rule::in($this->roleValues())],
            'password' => ['required', \Illuminate\Validation\Rules\Password::defaults()],
            'avatar' => ['nullable', UploadValidation::image()],
        ]);

        // Only a super admin may create another super admin.
        if ($validated['role'] === User::ROLE_SUPER_ADMIN && optional($request->user())->role !== User::ROLE_SUPER_ADMIN) {
            return back()->withErrors(['role' => 'Only a super admin can assign the Super Admin role.']);
        }

        // The 'password' => 'hashed' cast on the model hashes this on save.
        $user = User::create(collect($validated)->except('avatar')->all());

        if ($request->hasFile('avatar')) {
            $this->saveAvatar($user, $request->file('avatar'));
        }

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
            'password' => ['nullable', \Illuminate\Validation\Rules\Password::defaults()],
            'avatar' => ['nullable', UploadValidation::image()],
        ]);

        // Don't let anyone change their own role — avoids locking yourself out
        // (e.g. a super-admin demoting themselves and losing the super surface).
        if ($user->is($request->user()) && $validated['role'] !== $user->role) {
            return back()->withErrors(['role' => 'You cannot change your own role.']);
        }

        // Only a super admin may grant the Super Admin role (unless the target
        // already has it, so admins can still edit their other fields).
        if ($validated['role'] === User::ROLE_SUPER_ADMIN
            && $user->role !== User::ROLE_SUPER_ADMIN
            && optional($request->user())->role !== User::ROLE_SUPER_ADMIN) {
            return back()->withErrors(['role' => 'Only a super admin can assign the Super Admin role.']);
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

        if ($request->hasFile('avatar')) {
            $this->saveAvatar($user, $request->file('avatar'));
        }

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

    // ─── Profile avatar ───────────────────────────────────────────────────

    /**
     * Store an uploaded avatar for the given user — downscaled to 256×256 and
     * saved on the public disk at avatars/{id}.{ext}; replaces any previous
     * file. Shared by the admin create/edit-user flow and self-service upload.
     */
    private function saveAvatar(User $user, $file): void
    {
        $ext = match (strtolower((string) ($file->extension() ?: 'jpg'))) {
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
        $path = "avatars/{$user->id}.{$ext}";

        Storage::disk('public')->put($path, $this->downscaleAvatar($file, $ext));

        if ($user->avatar_path && $user->avatar_path !== $path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->forceFill(['avatar_path' => $path])->save();
    }

    /**
     * Upload (or replace) the current user's avatar. Image is downscaled to
     * fit 256×256 and stored on the public disk at avatars/{id}.{ext}.
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|'.UploadValidation::image()]);

        $user = $request->user();
        $file = $request->file('avatar');
        $ext = match (strtolower((string) ($file->extension() ?: 'jpg'))) {
            'png' => 'png',
            'webp' => 'webp',
            default => 'jpg',
        };
        $path = "avatars/{$user->id}.{$ext}";

        Storage::disk('public')->put($path, $this->downscaleAvatar($file, $ext));

        // Remove a previous avatar with a different extension.
        if ($user->avatar_path && $user->avatar_path !== $path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->forceFill(['avatar_path' => $path])->save();

        return back()->with('success', 'Profile photo updated.');
    }

    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->forceFill(['avatar_path' => null])->save();
        }

        return back()->with('success', 'Profile photo removed.');
    }

    /**
     * Downscale an uploaded image to fit within 256×256 (only shrinks) using
     * GD, returning the encoded bytes. Falls back to the original bytes if
     * the image can't be decoded.
     */
    private function downscaleAvatar(UploadedFile $file, string $ext): string
    {
        $src = $file->getRealPath();
        $info = @getimagesize($src);
        if (! $info) {
            return (string) file_get_contents($src);
        }

        [$w, $h] = $info;
        $max = 256;
        $scale = min(1, $max / max($w, $h));
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $mime = $info['mime'] ?? '';
        $image = match (true) {
            str_contains($mime, 'png') => @imagecreatefrompng($src),
            str_contains($mime, 'webp') => @imagecreatefromwebp($src),
            default => @imagecreatefromjpeg($src),
        };
        if (! $image) {
            return (string) file_get_contents($src);
        }

        $canvas = imagecreatetruecolor($nw, $nh);
        if (in_array($ext, ['png', 'webp'], true)) {
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
        }
        imagecopyresampled($canvas, $image, 0, 0, 0, 0, $nw, $nh, $w, $h);

        ob_start();
        match ($ext) {
            'png' => imagepng($canvas),
            'webp' => imagewebp($canvas),
            default => imagejpeg($canvas, null, 85),
        };
        $bytes = (string) ob_get_clean();

        imagedestroy($image);
        imagedestroy($canvas);

        return $bytes;
    }
}
