<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\MaintenanceMode;
use Illuminate\Http\Request;

/**
 * Super-admin screen for the public-site maintenance window.
 * Route is gated by `portal:super_admin` (exact role) in routes/web.php.
 */
class MaintenanceController extends Controller
{
    public function index()
    {
        [$startsAt, $endsAt] = MaintenanceMode::window();

        return inertia('admin/Maintenance', [
            'state' => [
                'enabled' => MaintenanceMode::manualEnabled(),
                'isActive' => MaintenanceMode::isActive(),
                'inScheduledWindow' => MaintenanceMode::inScheduledWindow(),
                'message' => MaintenanceMode::message(),
                'eta' => optional(MaintenanceMode::eta())->format('Y-m-d\TH:i'),
                'startsAt' => optional($startsAt)->format('Y-m-d\TH:i'),
                'endsAt' => optional($endsAt)->format('Y-m-d\TH:i'),
                'bypassUrl' => MaintenanceMode::bypassUrl(),
                'defaultMessage' => MaintenanceMode::DEFAULT_MESSAGE,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'enabled' => 'required|boolean',
            'message' => 'nullable|string|max:500',
            'eta' => 'nullable|date',
            'starts_at' => 'nullable|date',
            // A window needs both ends; requiring end > start stops an
            // inverted range that would never actually open.
            'ends_at' => 'nullable|date|required_with:starts_at|after:starts_at',
        ], [
            'ends_at.required_with' => 'Set an end time for the scheduled window.',
            'ends_at.after' => 'The window must end after it starts.',
        ]);

        // Clearing the start clears the end too, so a half-window can't linger.
        $startsAt = $data['starts_at'] ?? null;
        $endsAt = $startsAt ? ($data['ends_at'] ?? null) : null;

        $this->put(MaintenanceMode::KEY_ENABLED, $data['enabled'] ? '1' : '0', 'bool', 'Maintenance mode enabled');
        $this->put(MaintenanceMode::KEY_MESSAGE, $data['message'] ?? '', 'string', 'Maintenance message');
        $this->put(MaintenanceMode::KEY_ETA, $data['eta'] ?? '', 'string', 'Maintenance ETA');
        $this->put(MaintenanceMode::KEY_STARTS_AT, $startsAt ?? '', 'string', 'Maintenance window start');
        $this->put(MaintenanceMode::KEY_ENDS_AT, $endsAt ?? '', 'string', 'Maintenance window end');

        // Mint a bypass link on first use so there's always a way to preview.
        if (! MaintenanceMode::bypassToken()) {
            MaintenanceMode::regenerateBypassToken();
        }

        return back()->with('success', 'Maintenance settings saved.');
    }

    /**
     * Renders the real maintenance blade for the admin live preview, using
     * the values currently typed into the form (not what's saved). Served
     * as 200 so the iframe renders it normally; the public middleware still
     * returns the same view with a genuine 503.
     *
     * Rendering the actual view — rather than re-creating it in React —
     * means the preview can't drift from what visitors see.
     */
    public function preview(Request $request)
    {
        $data = $request->validate([
            'message' => 'nullable|string|max:500',
            'eta' => 'nullable|date',
        ]);

        $message = filled($data['message'] ?? null)
            ? $data['message']
            : MaintenanceMode::DEFAULT_MESSAGE;

        return response()->view('maintenance', [
            'message' => $message,
            'eta' => filled($data['eta'] ?? null) ? \Carbon\Carbon::parse($data['eta']) : null,
        ]);
    }

    /** Invalidate the old preview link and issue a fresh one. */
    public function regenerateBypass()
    {
        MaintenanceMode::regenerateBypassToken();

        return back()->with('success', 'New bypass link generated. The previous link no longer works.');
    }

    private function put(string $key, string $value, string $type, string $label): void
    {
        Setting::set($key, $value, $type, $label, 'maintenance');
    }
}
