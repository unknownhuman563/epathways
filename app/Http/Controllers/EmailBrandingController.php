<?php

namespace App\Http\Controllers;

use App\Models\EmailBranding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Admin management of per-department email branding (banner + CTA). Uploads
 * override the file-based defaults in config/email_branding.php.
 */
class EmailBrandingController extends Controller
{
    private function guard(): void
    {
        abort_unless(in_array(auth()->user()->role, ['admin', 'super_admin'], true), 403);
    }

    /** The manageable departments (Default + each portal), from the config map. */
    private function departments(): array
    {
        return collect(config('email_branding', []))
            ->map(fn ($cfg, $key) => ['key' => $key, 'label' => $cfg['label'] ?? ucfirst($key)])
            ->values()->all();
    }

    public function index()
    {
        $this->guard();

        $rows = EmailBranding::get()->keyBy('department');

        $items = collect($this->departments())->map(function ($d) use ($rows) {
            $assets = EmailBranding::resolveAssets($d['key']);
            $row = $rows->get($d['key']);

            return [
                'key' => $d['key'],
                'label' => $d['label'],
                'banner_url' => $assets['bannerUrl'],
                'footer_url' => $assets['footerUrl'],
                'has_custom_banner' => (bool) ($row && $row->banner_path),
                'has_custom_footer' => (bool) ($row && $row->footer_path),
                'hide_banner' => (bool) ($row?->hide_banner),
                'hide_footer' => (bool) ($row?->hide_footer),
                'booking_url' => $row?->booking_url ?? '',
                'call_number' => $row?->call_number ?? '',
                // The effective values in use (incl. the global fallback) for the hints.
                'effective_booking_url' => $assets['bookingUrl'],
                'effective_call_number' => $assets['callNumber'],
            ];
        })->values();

        return inertia('admin/EmailBranding', ['items' => $items]);
    }

    public function update(Request $request, string $department)
    {
        $this->guard();
        abort_unless(array_key_exists($department, config('email_branding', [])), 404);

        $request->validate([
            'banner' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:4096'],
            'footer' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:4096'],
            'remove_banner' => ['nullable', 'boolean'],
            'remove_footer' => ['nullable', 'boolean'],
            'booking_url' => ['nullable', 'string', 'url', 'max:500'],
            'call_number' => ['nullable', 'string', 'max:40'],
            'hide_banner' => ['nullable', 'boolean'],
            'hide_footer' => ['nullable', 'boolean'],
        ]);

        $row = EmailBranding::firstOrNew(['department' => $department]);

        // CTA button links — only touch a field that was actually submitted, so
        // an image upload doesn't wipe the links and vice-versa.
        if ($request->has('booking_url')) {
            $row->booking_url = $request->input('booking_url') ?: null;
        }
        if ($request->has('call_number')) {
            $row->call_number = $request->input('call_number') ?: null;
        }
        // Hide toggles — turn a banner/CTA off entirely for this department.
        if ($request->has('hide_banner')) {
            $row->hide_banner = $request->boolean('hide_banner');
        }
        if ($request->has('hide_footer')) {
            $row->hide_footer = $request->boolean('hide_footer');
        }

        foreach (['banner', 'footer'] as $field) {
            $col = $field.'_path';
            if ($request->hasFile($field)) {
                if ($row->{$col}) {
                    Storage::disk('public')->delete($row->{$col});
                }
                $row->{$col} = $request->file($field)->store('email-branding', 'public');
            } elseif ($request->boolean('remove_'.$field)) {
                if ($row->{$col}) {
                    Storage::disk('public')->delete($row->{$col});
                }
                $row->{$col} = null;
            }
        }

        $row->save();

        return back()->with('success', ucfirst($department).' email branding updated.');
    }
}
