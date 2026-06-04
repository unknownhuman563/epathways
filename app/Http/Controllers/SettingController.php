<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Admin index — lists every settings row grouped by `group`.
     */
    public function index()
    {
        $settings = Setting::query()->orderBy('group')->orderBy('key')->get();

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
            'values'   => 'required|array',
            'values.*' => 'nullable',
        ]);

        foreach ($payload['values'] as $key => $value) {
            $existing = Setting::query()->where('key', $key)->first();
            if (!$existing) continue;

            // For `int` settings, coerce so junk like "abc" doesn't silently
            // store as 0 — we just leave the previous value untouched.
            if ($existing->type === 'int' && !is_numeric($value)) continue;

            Setting::set($key, $value);
        }

        return back()->with('success', 'Settings updated.');
    }
}
