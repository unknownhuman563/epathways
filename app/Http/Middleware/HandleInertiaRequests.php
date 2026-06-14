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
                // Lead CSV import summary — surfaces +N new / N updated / N skipped chip.
                'import_summary' => $request->session()->get('import_summary'),
                // Assessment draft save — distinct from `success` so the page
                // doesn't flip to the "submission complete" screen on a save.
                'draft_saved' => $request->session()->get('draft_saved'),
                'draft_id'    => $request->session()->get('draft_id'),
                // Visa intake post-submit — used by the four visa intake
                // pages to swap the form for a persistent thank-you modal
                // once the controller saves the row. Carries the visa name
                // so the modal copy can read "Thanks for submitting your
                // Work Visa (AEWV) details" etc.
                'intake_submitted' => $request->session()->get('intake_submitted'),
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
            // Portal-sidebar badge counts — surfaces "what needs my attention
            // today" on the nav itself. Lazy so the queries only run for the
            // portal that's actually loading.
            'sidebarBadges' => fn () => $this->sidebarBadges($request),
            // Global unread-notification count — drives the topbar bell badge
            // across every portal. Re-shared on every Inertia navigation so
            // the badge stays fresh without polling.
            'notifications' => [
                'unread_count' => $request->user()?->unreadNotifications()->count() ?? 0,
            ],
        ];
    }

    /**
     * Per-portal sidebar badge counts. Returns only the badges relevant to
     * the current URL prefix so we never run sales queries on the lead
     * portal etc.
     */
    private function sidebarBadges(Request $request): array
    {
        $user = $request->user();
        if (! $user) return [];

        $path = $request->path();
        $out = [];

        if (str_starts_with($path, 'portal/immigration')) {
            $todayStart = now()->startOfDay();
            $weekStart  = now()->startOfWeek();
            $out['immigration'] = [
                'new_assessments'      => \App\Models\ResidentIntake::where('created_at', '>=', $weekStart)->count(),
                'new_leads_today'      => \App\Models\Lead::where('created_at', '>=', $todayStart)->count(),
                'active_cases'         => \App\Models\Lead::where('status', 'Visa Process')->count(),
                'docs_pending_review'  => \App\Models\LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count(),
                'notifications_unread' => $user->unreadNotifications()->count(),
            ];
        }

        if (str_starts_with($path, 'portal/education')) {
            $todayStart = now()->startOfDay();
            $out['education'] = [
                'new_leads_today'      => \App\Models\Lead::where('created_at', '>=', $todayStart)->count(),
                'docs_pending_review'  => \App\Models\LeadDocument::whereIn('status', ['Submitted', 'UnderReview'])->count(),
                'notifications_unread' => $user->unreadNotifications()->count(),
            ];
        }

        if (str_starts_with($path, 'portal/sales') || str_starts_with($path, 'admin')) {
            $todayStart = now()->startOfDay();
            $weekEnd    = now()->endOfWeek();

            $out['sales'] = [
                'new_leads_today'    => \App\Models\Lead::where('created_at', '>=', $todayStart)->count(),
                'tasks_open'         => \App\Models\LeadTask::where('assignee_id', $user->id)->where('completed', false)->count(),
                'tasks_overdue'      => \App\Models\LeadTask::where('assignee_id', $user->id)->where('completed', false)->whereNotNull('due_at')->where('due_at', '<', now())->count(),
                'bookings_this_week' => \App\Models\Booking::whereBetween('appointment_date', [now()->startOfWeek(), $weekEnd])->count(),
                'notifications_unread' => $user->unreadNotifications()->count(),
            ];
        }

        return $out;
    }
}
