<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Keys owned by a dedicated admin screen. They're deliberately hidden
     * from this generic editor — hand-editing `maintenance.enabled` here
     * would take the public site down with no confirmation or context.
     */
    private const MANAGED_ELSEWHERE = 'maintenance.%';

    /**
     * Admin index — lists every settings row grouped by `group`.
     */
    public function index()
    {
        $settings = Setting::query()
            ->where('key', 'not like', self::MANAGED_ELSEWHERE)
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        return inertia('admin/Settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * Bulk-update settings from the admin page. Body shape:
     * { values: { key1: value1, key2: value2, ... } }
     */
    public function update(Request $request)
    {
        $payload = $request->validate([
            'values' => 'required|array',
            'values.*' => 'nullable',
        ]);

        foreach ($payload['values'] as $key => $value) {
            // Never writable from here — see MANAGED_ELSEWHERE.
            if (str_starts_with($key, 'maintenance.')) {
                continue;
            }

            $existing = Setting::query()->where('key', $key)->first();
            if (! $existing) {
                continue;
            }

            // For `int` settings, coerce so junk like "abc" doesn't silently
            // store as 0 — we just leave the previous value untouched.
            if ($existing->type === 'int' && ! is_numeric($value)) {
                continue;
            }

            Setting::set($key, $value);
        }

        return back()->with('success', 'Settings updated.');
    }
}
