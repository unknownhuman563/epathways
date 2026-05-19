<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'lead_id' => $request->session()->get('lead_id'),
                'intake_id' => $request->session()->get('intake_id'),
                'review_success' => $request->session()->get('review_success'),
                'review_id' => $request->session()->get('review_id'),
                'edit_link_url' => $request->session()->get('edit_link_url'),
                'edit_link_intake_id' => $request->session()->get('edit_link_intake_id'),
                // Admin Portal Invitations — single-shot credential surfacing.
                'invitation_link' => $request->session()->get('invitation_link'),
                'invitation_link_lead_id' => $request->session()->get('invitation_link_lead_id'),
                'generated_credentials' => $request->session()->get('generated_credentials'),
            ],
            // Public contact channels for the sticky CTA bar, floating contact
            // widget, and footer. Components hide channels with empty values.
            'contact' => [
                'phone'     => config('services.contact.phone'),
                'whatsapp'  => config('services.contact.whatsapp'),
                'messenger' => config('services.contact.messenger'),
                'facebook'  => config('services.contact.facebook'),
                'email'     => config('services.contact.email'),
            ],
        ];
    }
}
