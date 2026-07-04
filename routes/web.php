<?php

use App\Http\Controllers\AccommodationController as PublicAccommodationController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Admin\SuperAdminDashboardController;
use App\Http\Controllers\AssessmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadDocumentController;
use App\Http\Controllers\LeadPortalInvitationController;
use App\Http\Controllers\LeadTrackingController;
use App\Http\Controllers\Portal\Accommodation\CalendarController;
use App\Http\Controllers\Portal\Accommodation\GasDeliveryController;
use App\Http\Controllers\Portal\Accommodation\MessageTemplateController;
use App\Http\Controllers\Portal\Accommodation\PaymentScheduleController;
use App\Http\Controllers\Portal\Accommodation\RentUtilitiesController;
use App\Http\Controllers\Portal\Accommodation\TenantController;
use App\Http\Controllers\Portal\AccommodationController;
use App\Http\Controllers\Portal\EducationController;
use App\Http\Controllers\Portal\EnglishController;
use App\Http\Controllers\Portal\EoiSubmissionController;
use App\Http\Controllers\Portal\ImmigrationController;
use App\Http\Controllers\Portal\PropertyController;
use App\Http\Controllers\Portal\SalesController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\ProgramPromoController;
use App\Http\Controllers\QuickLeadController;
use App\Http\Controllers\ResidentIntakeController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StudentIntakeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserReviewController;
use App\Http\Controllers\VisaTypeController;
use App\Http\Controllers\VisitorIntakeController;
use App\Http\Controllers\WorkIntakeController;
use App\Services\NewsFeedService;
use App\Services\PromoFeed;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index']);

Route::get('/booking', function () {
    return inertia('booking/BookingPage');
});
Route::post('/bookings', [BookingController::class, 'store']);

Route::get('/education-journey', function () {
    return inertia('education-journey/EducationJourneyPage', array_merge(
        UserReviewController::publicPayload(\App\Models\UserReview::DEPT_EDUCATION),
        ['activePromos' => PromoFeed::active()]
    ));
});

Route::get('/programs-levels', [ProgramController::class, 'publicIndex']);
Route::get('/program-details/{program}', [ProgramController::class, 'publicShow']);

Route::get('/fee-guide', [ProgramController::class, 'feeGuideIndex']);

Route::get('/about-us', function () {
    return inertia('about-us/AboutUsPage');
});

Route::get('/team/{slug}', fn (string $slug) => inertia('team/TeamProfilePage', [
    'slug' => $slug,
]));

Route::get('/immigration', function () {
    return inertia('immigration/ImmigrationPage', array_merge(
        UserReviewController::publicPayload(),
        ['news' => NewsFeedService::latest(3)]
    ));
});

// Admin moderation toggle for published / featured / status on a review.
// Both departments hit the same controller method — the moderation
// fields (is_published / is_featured / status / visa_type) are shared.
Route::middleware(['auth', 'portal:admin,immigration'])->post('/admin/immigration/user-reviews/{id}', [UserReviewController::class, 'adminUpdate'])
    ->name('admin.immigration.user-reviews.update');
Route::middleware(['auth', 'portal:admin,education'])->post('/admin/education/user-reviews/{id}', [UserReviewController::class, 'adminUpdate'])
    ->name('admin.education.user-reviews.update');

// Public inbound webhook from Zernio (new messages / comments). No auth — it's
// verified by Zernio's HMAC-SHA256 signature (X-Zernio-Signature) against
// ZERNIO_WEBHOOK_SECRET, and CSRF-exempt (see bootstrap/app.php). Bumps the
// inbox signal so open browsers refresh.
Route::post('/webhook/zernio', [App\Http\Controllers\AiAdsWebhookController::class, 'zernioWebhook'])->name('webhook.zernio');

Route::get('/accommodation', [PublicAccommodationController::class, 'index']);
// Expression of Interest — must be declared BEFORE /accommodation/{id} so the
// literal path isn't captured as an {id}.
Route::get('/accommodation/expression-of-interest-cold', [PublicAccommodationController::class, 'eoiForm'])->name('accommodation.eoi');
Route::post('/accommodation/expression-of-interest-cold', [PublicAccommodationController::class, 'eoiStore'])->name('accommodation.eoi.store');
Route::get('/accommodation/expression-of-interest-hot', [PublicAccommodationController::class, 'eoiHotForm'])->name('accommodation.eoi-hot');
Route::post('/accommodation/expression-of-interest-hot', [PublicAccommodationController::class, 'eoiHotStore'])->name('accommodation.eoi-hot.store');
// Public tenant concern form — declared before /accommodation/{slug}.
Route::get('/accommodation/concern', [App\Http\Controllers\ConcernController::class, 'form'])->name('accommodation.concern');
Route::post('/accommodation/concern', [App\Http\Controllers\ConcernController::class, 'store'])->name('accommodation.concern.store');

Route::get('/accommodation/{slug}', [PublicAccommodationController::class, 'show']);

Route::get('/accommodation/{id}/checkout', function ($id) {
    return inertia('accommodation/Checkout', ['id' => $id]);
});

Route::get('/coming-soon', function () {
    return inertia('coming-soon/ComingSoonPage');
});
Route::get('/immigration-assessment', function () {
    return inertia('visa/ImmigrationAssessment');
});

Route::get('/visa-assessment-form', function () {
    return inertia('visa/VisaAssessmentForm');
});

Route::get('/resident-interest', [ResidentIntakeController::class, 'showForm'])->name('resident-interest');
Route::post('/resident-interest', [ResidentIntakeController::class, 'store']);

// AEWV (Work) + Student (SV) + Visitor (GVV) intake forms. Each follows the
// same Resident pattern — submit creates an Assessment row that drives the
// Pay → Book funnel below.
Route::get('/work-interest', [WorkIntakeController::class,    'showForm'])->name('work-interest');
Route::post('/work-interest', [WorkIntakeController::class,    'store']);
Route::get('/student-interest', [StudentIntakeController::class, 'showForm'])->name('student-interest');
Route::post('/student-interest', [StudentIntakeController::class, 'store']);
Route::get('/visitor-interest', [VisitorIntakeController::class, 'showForm'])->name('visitor-interest');
Route::post('/visitor-interest', [VisitorIntakeController::class, 'store']);

// Token-based edit links (no auth — the opaque token is the bearer credential).
Route::get('/resident-interest/edit/{token}', [ResidentIntakeController::class, 'showEditForm'])->name('resident-interest.edit');
Route::post('/resident-interest/edit/{token}', [ResidentIntakeController::class, 'updateFromEditLink']);

// Pay → Book funnel — visa-type-agnostic. Token is created when the
// intake form is submitted; only the original applicant holds it. The same
// routes serve every visa type via the polymorphic intakeable_* columns.
Route::get('/assessment/{token}/pay', [AssessmentController::class, 'showPay'])->name('assessment.pay');
Route::post('/assessment/{token}/pay', [AssessmentController::class, 'simulatePay'])->name('assessment.pay.simulate');
Route::get('/assessment/{token}/book', [AssessmentController::class, 'showBook'])->name('assessment.book');
Route::post('/assessment/{token}/book', [AssessmentController::class, 'claimSlot'])->name('assessment.book.claim');
Route::get('/assessment/{token}/booked', [AssessmentController::class, 'booked'])->name('assessment.booked');

// Keep the old path working for any in-flight bookmarks / external links.
Route::permanentRedirect('/resident-intake', '/resident-interest');

Route::post('/user-reviews', [UserReviewController::class, 'store'])->name('user-reviews.store');

// Shareable client-review submission page. Staff send this link to clients
// who have completed their service so they can leave a review without
// hunting through the immigration / education-journey pages. Accepts
// ?dept=education|immigration|both and ?name= / ?email= for prefill.
Route::get('/leave-review', function () {
    $allowed = ['immigration', 'education', 'both'];
    $dept = request('dept');

    return inertia('leave-review/LeaveReviewPage', [
        'department' => in_array($dept, $allowed, true) ? $dept : 'immigration',
        'prefill' => [
            'name' => request('name'),
            'email' => request('email'),
        ],
    ]);
})->name('leave-review');

Route::get('/activities', [EventController::class, 'activities']);

Route::get('/visa-approved', function () {
    return inertia('visa/VisaApproved');
});

// Public application tracking — Ninja-Van-style lookup the department
// pastes to clients. /track shows the empty input; /track/{code} resolves
// a lead by tracking_code and renders info + documents + timeline. No
// auth: the tracking_code itself is the bearer credential. The same code
// authorises the lead to edit a tightly-scoped allow-list of fields and
// upload supporting documents (POST endpoints below).
Route::middleware('throttle:tracker')->group(function () {
    Route::get('/track', [LeadTrackingController::class, 'show'])->name('track');
    Route::get('/track/{code}', [LeadTrackingController::class, 'show'])->name('track.lookup');
    Route::post('/track/{code}/info', [LeadTrackingController::class, 'update'])->name('track.update');
    Route::post('/track/{code}/document', [LeadTrackingController::class, 'uploadDoc'])->name('track.upload');
    Route::post('/track/{code}/document/{doc}', [LeadTrackingController::class, 'updateDoc'])->name('track.doc.update');
    Route::delete('/track/{code}/document/{doc}', [LeadTrackingController::class, 'deleteDoc'])->name('track.doc.delete');

    // Build 11.D Phase 3 — Agreement signing. tracker_signing_token in the
    // URL is the bearer credential for the agreement; the controller
    // validates that it belongs to the lead resolved from {code}, so a
    // valid code paired with a guessed token still 404s.
    Route::get('/track/{code}/agreements/{token}/sign',     [\App\Http\Controllers\Tracker\TrackerAgreementController::class, 'showSigning'])->name('track.agreements.sign.show');
    Route::post('/track/{code}/agreements/{token}/sign',    [\App\Http\Controllers\Tracker\TrackerAgreementController::class, 'sign'])->name('track.agreements.sign');
    Route::get('/track/{code}/agreements/{token}/signed',   [\App\Http\Controllers\Tracker\TrackerAgreementController::class, 'signedConfirmation'])->name('track.agreements.signed');
});

// Public Registration & Assessment Routes
// Public "Quick Registration" — short marketing lead-capture form (a trimmed
// Free Assessment). Exact /register; the {event_code} variants below are the
// separate event-registration funnel.
Route::get('/register', [LeadController::class, 'showRegistration'])->name('register');
Route::post('/register', [LeadController::class, 'storeRegistration']);
Route::get('/register/full', [LeadController::class, 'showRegistrationFull'])->name('register.full');
Route::get('/register/{event_code}', [EventController::class, 'showRegistrationForm']);
Route::post('/register/{event_code}', [EventController::class, 'registerLead']);
Route::get('/free-assessment', [LeadController::class, 'showFreeAssessment'])->name('free-assessment');
Route::post('/free-assessment', [LeadController::class, 'storeFreeAssessment']);

// Education Enrolment — clean IntakeFormShell-based 7-step assessment.
// Separate controller method because the payload is simpler than the full
// free-assessment shape and gets tagged as `education-enrolment`.
Route::get('/education-enrolment', [LeadController::class, 'showEducationEnrolment'])->name('education-enrolment');
Route::post('/education-enrolment', [LeadController::class, 'storeEducationEnrolmentFull']);
Route::post('/education-enrolment/draft', [LeadController::class, 'saveAssessmentDraft'])->name('education-enrolment.draft');

// Free Assessment draft endpoint — same handler, tagged via URL.
Route::post('/free-assessment/draft', [LeadController::class, 'saveAssessmentDraft'])->name('free-assessment.draft');
Route::get('/assessment-result/{lead_id}', [LeadController::class, 'showAssessmentResult'])->name('assessment-result');

// Lightweight inline lead capture (hero, exit-intent, fee-guide download,
// footer newsletter, etc.) — writes into the same `leads` table with
// source-tagging so the sales pipeline sees one funnel.
Route::post('/quick-lead', [QuickLeadController::class, 'store'])->name('quick-lead');

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Self-service password reset (Laravel password broker, 60-min tokens).
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
});

// Lead Portal account setup — the invitation token itself acts as auth,
// so these routes sit outside the auth middleware.
Route::get('/lead-portal/setup/{token}', [LeadPortalInvitationController::class, 'setup'])
    ->name('lead-portal.setup')->middleware('guest');
Route::post('/lead-portal/setup/{token}', [LeadPortalInvitationController::class, 'store'])
    ->middleware('guest');

// External calendar sync — self-authenticates via the X-Sync-Token header
// (see SyncController), so it must sit OUTSIDE the auth/admin group.
Route::post('/api/sync-calendar', [App\Http\Controllers\SyncController::class, 'syncCalendar']);

// Authenticated areas — every staff user must be logged in ('auth'); role
// middleware nested below narrows each section ('portal:admin', 'portal:sales', …).
Route::middleware(['auth'])->group(function () {

    // System request tickets — any staff member can raise one (leads are
    // blocked inside the controller).
    Route::post('/tickets', [\App\Http\Controllers\SystemTicketController::class, 'store'])->name('tickets.store');

    // Active message templates (JSON) — feeds the bulk-email + compose pickers.
    // Any authenticated staff member; no lead-specific data is exposed.
    Route::get('/api/message-templates', function () {
        return response()->json(
            \App\Models\MessageTemplate::active()->orderBy('name')
                ->get(['id', 'name', 'channels', 'email_subject', 'email_body', 'sms_body'])
        );
    })->name('api.message-templates');

    // AI Foundation (Build 9) — JSON endpoints for the topbar chat panel and
    // the lead health badge. Session-auth (CSRF via X-XSRF-TOKEN from JS);
    // each handler re-checks the AI kill switch + per-user/role scoping.
    Route::prefix('api/ai')->name('api.ai.')->group(function () {
        Route::get('/conversations', [\App\Http\Controllers\Api\AiChatController::class, 'index'])->name('conversations.index');
        Route::get('/conversations/{conversation}', [\App\Http\Controllers\Api\AiChatController::class, 'show'])->name('conversations.show');
        Route::post('/messages', [\App\Http\Controllers\Api\AiChatController::class, 'sendMessage'])->name('messages.store');
        Route::delete('/conversations/{conversation}', [\App\Http\Controllers\Api\AiChatController::class, 'destroy'])->name('conversations.destroy');

        Route::get('/leads/{lead}/analysis', [\App\Http\Controllers\Api\AiLeadAnalysisController::class, 'show'])->name('leads.analysis.show');
        Route::post('/leads/{lead}/analysis/refresh', [\App\Http\Controllers\Api\AiLeadAnalysisController::class, 'refresh'])->name('leads.analysis.refresh');

        // Immigration cases are Lead records; {case} binds to Lead. Strict
        // role gate (admin + immigration staff only) lives in the controller.
        Route::get('/cases/{case}/analysis', [\App\Http\Controllers\Api\AiCaseAnalysisController::class, 'show'])->name('cases.analysis.show');
        Route::post('/cases/{case}/analysis/refresh', [\App\Http\Controllers\Api\AiCaseAnalysisController::class, 'refresh'])->name('cases.analysis.refresh');
    });

    // Profile avatar — role-agnostic; any authenticated user manages their own.
    Route::post('/profile/avatar', [UserController::class, 'uploadAvatar'])->name('profile.avatar.upload');
    Route::delete('/profile/avatar', [UserController::class, 'deleteAvatar'])->name('profile.avatar.delete');

    // Global search — Cmd+K across leads, tenants, properties, programs,
    // schools, English classes/assessments, applications, bookings.
    // Role-gated inside the service.
    Route::get('/api/search', [SearchController::class, 'search'])->name('search');

    // Notifications read path — role-agnostic; every authenticated user
    // reads their own in-app notifications (bell dropdown + full page).
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/api/notifications/recent', [NotificationController::class, 'recent'])->name('notifications.recent');
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Super-admin-only — the top-of-house cross-department overview.
    // `portal:super_admin` is exact-role (see User::canAccessPortal), so
    // plain admins do NOT see this surface.
    Route::middleware('portal:super_admin')->group(function () {
        Route::get('/admin/super-dashboard', [SuperAdminDashboardController::class, 'dashboard'])
            ->name('admin.super-dashboard');
    });

    // Admin area — admin role only; department-portal staff are kept out by 'portal:admin'.
    Route::middleware('portal:admin')->group(function () {
        Route::redirect('/admin', '/admin/dashboard');
        Route::get('/admin/dashboard', function () {
            return inertia('admin/Dashboard', [
                'ticketSummary' => \App\Models\SystemTicket::dashboardSummary(),
            ]);
        });
        Route::get('/admin/team-cards', fn () => inertia('admin/TeamCards'))->name('admin.team-cards');
        Route::get('/admin/leads', [LeadController::class, 'index'])->name('admin.leads');
        Route::get('/admin/events', [EventController::class, 'index'])->name('admin.events');
        Route::post('/admin/events', [EventController::class, 'store']);
        Route::get('/admin/events/{id}', [EventController::class, 'show'])->name('admin.events.show');
        Route::post('/admin/events/{id}', [EventController::class, 'update']);
        Route::delete('/admin/events/{id}', [EventController::class, 'destroy']);

        Route::get('/admin/programs', [ProgramController::class, 'index'])->name('admin.programs');
        Route::get('/admin/facebook-live', [App\Http\Controllers\FacebookLiveController::class, 'index'])->name('admin.facebook-live');
        Route::post('/admin/facebook-live', [App\Http\Controllers\FacebookLiveController::class, 'store']);
        Route::post('/admin/facebook-live/{id}', [App\Http\Controllers\FacebookLiveController::class, 'update']);
        Route::delete('/admin/facebook-live/{id}', [App\Http\Controllers\FacebookLiveController::class, 'destroy']);
        Route::post('/admin/programs', [ProgramController::class, 'store']);
        Route::post('/admin/programs/{id}', [ProgramController::class, 'update']);
        Route::delete('/admin/programs/{id}', [ProgramController::class, 'destroy']);

        Route::get('/admin/booking', [BookingController::class, 'index'])->name('admin.bookings');
        Route::post('/admin/bookings/{id}', [BookingController::class, 'update']);

        Route::get('/admin/settings', [SettingController::class, 'index'])->name('admin.settings');
        Route::post('/admin/settings', [SettingController::class, 'update']);

        Route::get('/admin/availability', [AvailabilityController::class, 'index'])->name('admin.availability');
        Route::post('/admin/availability', [AvailabilityController::class, 'store']);
        Route::post('/admin/availability/{id}', [AvailabilityController::class, 'update']);
        Route::delete('/admin/availability/{id}', [AvailabilityController::class, 'destroy']);

        Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users');
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::post('/admin/users/{id}', [UserController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);

        Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])->name('admin.activity-logs');

        // Message templates — staff-editable email/SMS templates.
        Route::get('/admin/message-templates', [\App\Http\Controllers\MessageTemplateController::class, 'index'])->name('admin.message-templates');
        Route::get('/admin/message-templates/create', [\App\Http\Controllers\MessageTemplateController::class, 'create'])->name('admin.message-templates.create');
        Route::post('/admin/message-templates', [\App\Http\Controllers\MessageTemplateController::class, 'store'])->name('admin.message-templates.store');
        Route::get('/admin/message-templates/{id}', [\App\Http\Controllers\MessageTemplateController::class, 'show'])->name('admin.message-templates.show');
        Route::put('/admin/message-templates/{id}', [\App\Http\Controllers\MessageTemplateController::class, 'update'])->name('admin.message-templates.update');
        Route::delete('/admin/message-templates/{id}', [\App\Http\Controllers\MessageTemplateController::class, 'destroy'])->name('admin.message-templates.destroy');
        Route::post('/admin/message-templates/{id}/test', [\App\Http\Controllers\MessageTemplateController::class, 'sendTest'])->name('admin.message-templates.test');

        // System request tickets — admin + super-admin triage board.
        Route::get('/admin/system-tickets', [\App\Http\Controllers\SystemTicketController::class, 'adminIndex'])->name('admin.system-tickets');
        Route::post('/admin/system-tickets/{id}', [\App\Http\Controllers\SystemTicketController::class, 'adminUpdate'])->name('admin.system-tickets.update');

        // All Tasks — cross-department view. Same TaskBoardPage component the
        // department portals render, with admin scope (no assignee filter
        // by default + read-only on rows from other departments).
        Route::get('/admin/tasks', App\Http\Controllers\AdminTaskController::class)->name('admin.tasks');

        // AI Ads — Cerebras local copy brainstorming + PLAI Partner API for
        // launching to FB/IG/Google/LinkedIn/TikTok/etc. PLAI launch is
        // dormant until PLAI_API_KEY is set in .env (see config/services.php).
        Route::get('/admin/ai-ads', [App\Http\Controllers\AiAdController::class, 'index'])->name('admin.ai-ads');
        Route::get('/admin/ai-ads/plai/connection', [App\Http\Controllers\AiAdController::class, 'testConnection'])->name('admin.ai-ads.plai.connection');
        Route::post('/admin/ai-ads/generate', [App\Http\Controllers\AiAdController::class, 'generateCopy'])->name('admin.ai-ads.generate');
        Route::post('/admin/ai-ads/launch', [App\Http\Controllers\AiAdController::class, 'launch'])->name('admin.ai-ads.launch');

        // Social — restructured admin pages (Phase 2). Each route renders an
        // Inertia page under resources/js/pages/admin/social/. The bare /social
        // entry redirects to /social/compose so the sidebar link always lands
        // on a usable screen.
        Route::get('/social', fn () => redirect('/social/compose'))->name('social');
        Route::get('/social/compose', fn () => inertia('admin/social/Compose'))->name('social.compose');
        Route::get('/social/scheduled', fn () => inertia('admin/social/Scheduled'))->name('social.scheduled');
        Route::get('/social/inbox', fn () => inertia('admin/social/Inbox'))->name('social.inbox');
        Route::get('/social/ads', fn () => inertia('admin/social/Ads'))->name('social.ads');
        Route::get('/social/performance', fn () => inertia('admin/social/Performance'))->name('social.performance');
        Route::get('/social/accounts', fn () => inertia('admin/social/Accounts'))->name('social.accounts');

        // Social MVP webhook proxy — Laravel routes the React UI hits.
        // AiAdsWebhookController forwards to n8n when configured, otherwise
        // returns stub data so the UI can be built in isolation. See
        // app/Http/Controllers/AiAdsWebhookController.php for the contract.
        Route::prefix('webhook/social')->name('webhook.social.')->group(function () {
            Route::get('/stats', [App\Http\Controllers\AiAdsWebhookController::class, 'stats'])->name('stats');
            Route::post('/generate-variants', [App\Http\Controllers\AiAdsWebhookController::class, 'generateVariants'])->name('generate-variants');
            Route::get('/list-variants', [App\Http\Controllers\AiAdsWebhookController::class, 'listVariants'])->name('list-variants');
            Route::post('/update-variant', [App\Http\Controllers\AiAdsWebhookController::class, 'updateVariant'])->name('update-variant');
            Route::post('/reject-variant', [App\Http\Controllers\AiAdsWebhookController::class, 'rejectVariant'])->name('reject-variant');
            Route::post('/approve-variant', [App\Http\Controllers\AiAdsWebhookController::class, 'approveVariant'])->name('approve-variant');
            Route::get('/list-scheduled', [App\Http\Controllers\AiAdsWebhookController::class, 'listScheduled'])->name('list-scheduled');
            Route::post('/reschedule', [App\Http\Controllers\AiAdsWebhookController::class, 'reschedule'])->name('reschedule');
            Route::post('/cancel-post', [App\Http\Controllers\AiAdsWebhookController::class, 'cancelPost'])->name('cancel-post');
            Route::post('/quick-post', [App\Http\Controllers\AiAdsWebhookController::class, 'quickPost'])->name('quick-post');
            Route::get('/list-accounts', [App\Http\Controllers\AiAdsWebhookController::class, 'listAccounts'])->name('list-accounts');
            Route::post('/start-oauth', [App\Http\Controllers\AiAdsWebhookController::class, 'startOauth'])->name('start-oauth');
            Route::post('/disconnect', [App\Http\Controllers\AiAdsWebhookController::class, 'disconnectAccount'])->name('disconnect');

            // Inbox (Phase 3) — conversations, messages, comments.
            Route::get('/inbox-conversations', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxConversations'])->name('inbox-conversations');
            Route::get('/inbox-messages', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxMessages'])->name('inbox-messages');
            Route::post('/inbox-send', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxSend'])->name('inbox-send');
            Route::post('/inbox-read', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxRead'])->name('inbox-read');
            Route::get('/inbox-signal', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxSignal'])->name('inbox-signal');
            Route::get('/inbox-comments', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxComments'])->name('inbox-comments');
            Route::post('/inbox-reply-comment', [App\Http\Controllers\AiAdsWebhookController::class, 'inboxReplyComment'])->name('inbox-reply-comment');

            // Ads (Phase 3) — list, ad accounts, boost, analytics.
            Route::get('/published-posts', [App\Http\Controllers\AiAdsWebhookController::class, 'publishedPosts'])->name('published-posts');
            Route::get('/ads-list', [App\Http\Controllers\AiAdsWebhookController::class, 'adsList'])->name('ads-list');
            Route::get('/ad-accounts', [App\Http\Controllers\AiAdsWebhookController::class, 'adAccounts'])->name('ad-accounts');
            Route::post('/ads-boost', [App\Http\Controllers\AiAdsWebhookController::class, 'adsBoost'])->name('ads-boost');
            Route::post('/create-ad', [App\Http\Controllers\AiAdsWebhookController::class, 'createAd'])->name('create-ad');
            Route::post('/ai-ad-copy', [App\Http\Controllers\AiAdsWebhookController::class, 'aiAdCopy'])->name('ai-ad-copy');
            Route::get('/ad-analytics', [App\Http\Controllers\AiAdsWebhookController::class, 'adAnalytics'])->name('ad-analytics');
            Route::get('/ad-targeting-search', [App\Http\Controllers\AiAdsWebhookController::class, 'adTargetingSearch'])->name('ad-targeting-search');
            Route::post('/ai-targeting', [App\Http\Controllers\AiAdsWebhookController::class, 'aiTargeting'])->name('ai-targeting');
            Route::get('/ad-audiences', [App\Http\Controllers\AiAdsWebhookController::class, 'adAudiences'])->name('ad-audiences');
            Route::post('/ad-audience-save', [App\Http\Controllers\AiAdsWebhookController::class, 'adAudienceSave'])->name('ad-audience-save');

            // Performance (Phase 2b) — post analytics joined with lead counts.
            Route::get('/analytics', [App\Http\Controllers\AiAdsWebhookController::class, 'analytics'])->name('analytics');
        });

        // Lead Portal invitations — admin approval / rejection / revocation.
        // Sales requests via /portal/sales/... (separate route below).
        Route::get('/admin/portal-invitations', [LeadPortalInvitationController::class, 'adminIndex'])
            ->name('admin.portal-invitations');
        Route::post('/admin/leads/{id}/portal-invitation/approve', [LeadPortalInvitationController::class, 'approve'])
            ->name('admin.portal-invitation.approve');
        Route::post('/admin/leads/{id}/portal-invitation/reject', [LeadPortalInvitationController::class, 'reject'])
            ->name('admin.portal-invitation.reject');
        Route::post('/admin/leads/{id}/portal-invitation/revoke', [LeadPortalInvitationController::class, 'revoke'])
            ->name('admin.portal-invitation.revoke');
        Route::post('/admin/leads/{id}/portal-invitation/generate-credentials', [LeadPortalInvitationController::class, 'generateCredentials'])
            ->name('admin.portal-invitation.generate-credentials');
        Route::post('/admin/leads/{id}/portal-invitation/reset-password', [LeadPortalInvitationController::class, 'resetPassword'])
            ->name('admin.portal-invitation.reset-password');
    });

    // Program Promotions — admin / sales / education can manage time-bound
    // discount campaigns shown on the public Home + Education Journey +
    // Programs pages. Banner image uploads land in storage/app/public/promos.
    Route::middleware('portal:admin,sales,education')->group(function () {
        Route::get('/admin/promos', [ProgramPromoController::class, 'index'])->name('admin.promos');
        Route::post('/admin/promos', [ProgramPromoController::class, 'store']);
        Route::post('/admin/promos/{id}', [ProgramPromoController::class, 'update']);
        Route::delete('/admin/promos/{id}', [ProgramPromoController::class, 'destroy']);
    });

    // Lead detail view + stage update — any logged-in staff (admin OR any
    // department portal) can view a lead and advance its pipeline stage.
    // Every change is audited via the LogsActivity trait on the Lead model.
    Route::middleware('portal:admin,sales,education,english,immigration,accommodation')->group(function () {
        // Per-registrant view: renders JUST the form the lead filled at
        // registration, plus an editable notes area. Any department that
        // owns leads may open it (sales sees registrants on the Leads
        // page's Events tab; other departments may drill in from their
        // own event dashboards).
        Route::get('/admin/events/{eventId}/registrants/{leadId}', [EventController::class, 'showRegistrant'])
            ->name('admin.events.registrant.show');
        Route::post('/admin/events/{eventId}/registrants/{leadId}/notes', [EventController::class, 'updateRegistrantNotes'])
            ->name('admin.events.registrant.notes');

        Route::get('/admin/leads/{id}', [LeadController::class, 'show'])->name('admin.leads.show');
        Route::post('/admin/leads/{id}/stage', [LeadController::class, 'updateStage'])->name('admin.leads.stage');
        // Archive (soft-delete) a lead / case — used by the Cases + Leads row menus.
        Route::delete('/admin/leads/{id}', [LeadController::class, 'destroy'])->name('admin.leads.destroy');
        Route::post('/admin/leads/{id}/personal', [LeadController::class, 'updatePersonal'])->name('admin.leads.personal');
        Route::post('/admin/leads/{id}/journey', [LeadController::class, 'updateJourney'])->name('admin.leads.journey');
        Route::post('/admin/leads/{id}/convert-to-student', [LeadController::class, 'convertToStudent'])->name('admin.leads.convert-student');
        Route::post('/admin/leads/{id}/revert-student', [LeadController::class, 'revertStudent'])->name('admin.leads.revert-student');
        Route::post('/admin/leads/{id}/convert-to-case', [LeadController::class, 'convertToCase'])->name('admin.leads.convert-case');
        Route::post('/admin/leads/{id}/revert-case', [LeadController::class, 'revertCase'])->name('admin.leads.revert-case');
        Route::post('/admin/leads/{id}/convert-to-accommodation', [LeadController::class, 'convertToAccommodation'])->name('admin.leads.convert-accommodation');
        Route::post('/admin/leads/{id}/revert-accommodation', [LeadController::class, 'revertAccommodation'])->name('admin.leads.revert-accommodation');
        Route::post('/admin/leads/{id}/convert-to-english', [LeadController::class, 'convertToEnglish'])->name('admin.leads.convert-english');
        Route::post('/admin/leads/{id}/revert-english', [LeadController::class, 'revertEnglish'])->name('admin.leads.revert-english');
        Route::post('/admin/leads/{id}/inz', [LeadController::class, 'updateInz'])->name('admin.leads.inz');
        Route::post('/admin/leads/{id}/send-tracker-link', [LeadController::class, 'sendTrackerLink'])->name('admin.leads.send-tracker-link');

        // Per-lead communications (Build 11.A) — compose a one-off message and
        // read the message history. Access is re-checked per lead inside the
        // controller (LeadAccess), so the broad route group can't leak a lead
        // across departments.
        Route::post('/admin/leads/{lead}/compose', [\App\Http\Controllers\Sales\ComposeMessageController::class, 'send'])->name('admin.leads.compose');
        Route::get('/admin/leads/{lead}/communications', [\App\Http\Controllers\Sales\LeadCommunicationsController::class, 'index'])->name('admin.leads.communications');

        // Cross-lead document queue — review lead-submitted docs in bulk.
        Route::get('/admin/document-queue', [\App\Http\Controllers\DocumentQueueController::class, 'index'])->name('admin.document-queue');
        Route::post('/admin/document-queue/bulk', [\App\Http\Controllers\DocumentQueueController::class, 'bulk'])->name('admin.document-queue.bulk');

        // Bulk CSV import — duplicates detected by email or name+phone.
        Route::post('/admin/leads/import', [LeadController::class, 'importLeads'])->name('admin.leads.import');
        Route::post('/admin/leads/{id}/documents/checklist', [LeadController::class, 'updateDocumentChecklist'])->name('admin.leads.documents.checklist');
        Route::post('/admin/leads/{id}/documents/section-verification', [LeadController::class, 'updateSectionVerification'])->name('admin.leads.documents.section-verification');

        // Internal notes — any staff role can add, only author or admin can edit/delete.
        Route::get('/admin/leads/{id}/notes', [\App\Http\Controllers\LeadNoteController::class, 'index'])
            ->name('admin.leads.notes.index');
        Route::post('/admin/leads/{id}/notes', [\App\Http\Controllers\LeadNoteController::class, 'store'])
            ->name('admin.leads.notes.store');
        Route::post('/admin/leads/{leadId}/notes/{noteId}', [\App\Http\Controllers\LeadNoteController::class, 'update'])
            ->name('admin.leads.notes.update');
        Route::delete('/admin/leads/{leadId}/notes/{noteId}', [\App\Http\Controllers\LeadNoteController::class, 'destroy'])
            ->name('admin.leads.notes.destroy');

        // Tags — free-form, auto-created on first use. /tags index feeds
        // the client-side autocomplete.
        Route::get('/admin/tags', [\App\Http\Controllers\LeadTagController::class, 'index'])
            ->name('admin.tags.index');
        Route::post('/admin/leads/{id}/tags', [\App\Http\Controllers\LeadTagController::class, 'attach'])
            ->name('admin.leads.tags.attach');
        Route::delete('/admin/leads/{leadId}/tags/{tagId}', [\App\Http\Controllers\LeadTagController::class, 'detach'])
            ->name('admin.leads.tags.detach');

        // Tasks — any staff can create + complete; only creator/admin can delete.
        Route::post('/admin/leads/{id}/tasks', [\App\Http\Controllers\LeadTaskController::class, 'store'])
            ->name('admin.leads.tasks.store');
        Route::post('/admin/leads/{leadId}/tasks/{taskId}', [\App\Http\Controllers\LeadTaskController::class, 'update'])
            ->name('admin.leads.tasks.update');
        Route::delete('/admin/leads/{leadId}/tasks/{taskId}', [\App\Http\Controllers\LeadTaskController::class, 'destroy'])
            ->name('admin.leads.tasks.destroy');
    });

    // Lead documents — admins AND sales agents both work these. The lead's
    // own upload routes are under the lead-portal group below. Build 11.D
    // Phase 4 widens the gate to immigration roles too: the Case Profile's
    // Documents tab is read+write for immigration consultants, so they need
    // the approve/reject/request endpoints. The case-side controller already
    // re-verifies is_immigration_case before letting the tab render, and
    // updateStatus is per-document so a sales lead's documents can't be
    // touched from this widened gate (no Lead Profile route routes them
    // here).
    Route::middleware('portal:admin,sales,immigration,immigration_manager,immigration_adviser')->group(function () {
        Route::get('/admin/leads/{id}/documents', [LeadDocumentController::class, 'staffIndex'])
            ->name('admin.leads.documents');
        Route::post('/admin/leads/{id}/documents/requests', [LeadDocumentController::class, 'requestStore'])
            ->name('admin.leads.documents.request');
        Route::delete('/admin/leads/{leadId}/documents/requests/{requestId}', [LeadDocumentController::class, 'destroyRequest'])
            ->name('admin.leads.documents.request.destroy');
        Route::post('/admin/leads/{leadId}/documents/{docId}/status', [LeadDocumentController::class, 'updateStatus'])
            ->name('admin.leads.documents.status');
        Route::post('/admin/leads/{id}/documents/share', [LeadDocumentController::class, 'shareWithLead'])
            ->name('admin.leads.documents.share');
    });

    // Documents-tab checklist uploads + per-file delete + downloads — wider
    // group so every department portal that can see the documents tab can
    // also manage and download files. The download controller does its own
    // role-gated check on the specific lead before streaming the file.
    Route::middleware('portal:admin,sales,education,english,immigration,accommodation,finance')->group(function () {
        Route::post('/admin/leads/{id}/documents/checklist/{key}/upload', [LeadDocumentController::class, 'staffChecklistUpload'])
            ->name('admin.leads.documents.checklist.upload');
        // Templated agreement generator — Blade -> PDF -> attached as a
        // LeadDocument with source='generated'. Only agree.consultancy
        // (single|partner variant) is wired up right now.
        Route::post('/admin/leads/{id}/documents/checklist/{key}/generate', [LeadDocumentController::class, 'generateAgreement'])
            ->name('admin.leads.documents.checklist.generate');
        Route::delete('/admin/leads/{leadId}/documents/{docId}', [LeadDocumentController::class, 'destroyDocument'])
            ->name('admin.leads.documents.destroy');
        // Staff download — same controller, role-gated inside.
        Route::get('/admin/documents/{docId}/download', [LeadDocumentController::class, 'download'])
            ->name('admin.documents.download');
        // Bundle all of a lead's documents into a single ZIP.
        Route::get('/admin/leads/{leadId}/documents/download-all', [LeadDocumentController::class, 'downloadAll'])
            ->name('admin.leads.documents.download-all');
        // Toggle a checklist item's visibility on the public tracking link.
        Route::post('/admin/leads/{leadId}/documents/track-visibility', [LeadDocumentController::class, 'toggleTrackVisibility'])
            ->name('admin.leads.documents.track-visibility');

        // Task Board — cross-portal Task API for the New Task modal.
        // Lives in routes/web.php (not routes/api.php) so it inherits the
        // session-auth + CSRF middleware Inertia POSTs already use. The
        // existing per-lead POST /admin/leads/{id}/tasks endpoint is
        // unchanged; this is an additional path that also handles
        // department/personal tasks (no lead_id).
        Route::post('/api/tasks', [App\Http\Controllers\TaskController::class, 'store'])->name('api.tasks.store');
        Route::patch('/api/tasks/{id}', [App\Http\Controllers\TaskController::class, 'update'])->name('api.tasks.update');
        Route::post('/api/tasks/{id}/attachments', [App\Http\Controllers\TaskController::class, 'attach'])->name('api.tasks.attach');
        Route::get('/api/tasks/{id}/comments', [App\Http\Controllers\TaskController::class, 'comments'])->name('api.tasks.comments');
        Route::post('/api/tasks/{id}/comments', [App\Http\Controllers\TaskController::class, 'storeComment'])->name('api.tasks.comments.store');
        Route::get('/api/tasks/related-records', [App\Http\Controllers\TaskController::class, 'relatedRecords'])->name('api.tasks.related-records');
    });

    // Department-scoped email/SMS templates — every department portal manages
    // its own set through the shared MessageTemplateController, which scopes
    // itself to the acting staff member's department. Admins manage all via
    // /admin/message-templates above. The immigration portal middleware also
    // admits the immigration manager/adviser sub-roles.
    foreach (\App\Models\User::PORTAL_ROLES as $deptRole) {
        Route::middleware("portal:{$deptRole}")
            ->prefix("portal/{$deptRole}")
            ->name("portal.{$deptRole}.")
            ->group(function () {
                $c = \App\Http\Controllers\MessageTemplateController::class;
                Route::get('/email-templates', [$c, 'index'])->name('email-templates');
                Route::get('/email-templates/create', [$c, 'create'])->name('email-templates.create');
                Route::post('/email-templates', [$c, 'store'])->name('email-templates.store');
                Route::get('/email-templates/{id}', [$c, 'show'])->name('email-templates.show');
                Route::put('/email-templates/{id}', [$c, 'update'])->name('email-templates.update');
                Route::delete('/email-templates/{id}', [$c, 'destroy'])->name('email-templates.destroy');
                Route::post('/email-templates/{id}/test', [$c, 'sendTest'])->name('email-templates.test');
            });
    }

    // Manual lead status-update emails — staff send a department (or shared)
    // template to a lead from the lead detail screen. Available to admins and
    // every department portal. The GET lists templates the user may send.
    Route::middleware('portal:admin,sales,education,english,immigration,accommodation')->group(function () {
        Route::get('/lead-message/templates', [\App\Http\Controllers\LeadMessageController::class, 'templates'])->name('lead-message.templates');
        Route::post('/leads/{lead}/send-message', [\App\Http\Controllers\LeadMessageController::class, 'send'])->name('leads.send-message');
    });

    // Immigration management screens — shared between admins and immigration-role staff.
    // They live under /admin/immigration/... for historical reasons; the immigration
    // portal's sidebar deep-links here.
    Route::middleware('portal:admin,immigration')->group(function () {
        Route::get('/admin/immigration/resident-intakes', [ResidentIntakeController::class, 'adminIndex'])->name('admin.immigration.resident-intakes');
        Route::get('/admin/immigration/resident-intakes/{id}', [ResidentIntakeController::class, 'adminShow'])->name('admin.immigration.resident-intakes.show');
        Route::get('/admin/immigration/resident-intakes/{id}/documents/{key}/{index?}', [ResidentIntakeController::class, 'downloadDocument'])->name('admin.immigration.resident-intakes.document');
        Route::post('/admin/immigration/resident-intakes/{id}/edit-link', [ResidentIntakeController::class, 'generateEditLink'])->name('admin.immigration.resident-intakes.edit-link');

        Route::get('/admin/immigration/user-reviews', fn () => app(UserReviewController::class)->adminIndex('immigration'))->name('admin.immigration.user-reviews');
        Route::get('/admin/immigration/user-reviews/{id}', fn ($id) => app(UserReviewController::class)->adminShow($id, 'immigration'))->name('admin.immigration.user-reviews.show');
    });

    // Education User Reviews — mirrors the immigration management screens.
    // Same controller + React components; the department arg scopes the
    // dataset to education-tagged reviews only.
    Route::middleware('portal:admin,education')->group(function () {
        Route::get('/admin/education/user-reviews', fn () => app(UserReviewController::class)->adminIndex('education'))->name('admin.education.user-reviews');
        Route::get('/admin/education/user-reviews/{id}', fn ($id) => app(UserReviewController::class)->adminShow($id, 'education'))->name('admin.education.user-reviews.show');

        // Schools catalog — education team uses this from their Setup
        // sidebar to add institutions students get placed into.
        Route::get('/admin/schools', [\App\Http\Controllers\SchoolController::class, 'index'])->name('admin.schools');
        Route::post('/admin/schools', [\App\Http\Controllers\SchoolController::class, 'store']);
        Route::post('/admin/schools/{id}', [\App\Http\Controllers\SchoolController::class, 'update']);
        Route::delete('/admin/schools/{id}', [\App\Http\Controllers\SchoolController::class, 'destroy']);
    });

    // Unified User Reviews — single page with Immigration / Education
    // tabs. Replaces the two separate sidebar entries.
    Route::middleware('portal:admin,education,immigration')->group(function () {
        Route::get('/admin/user-reviews', [UserReviewController::class, 'adminUnifiedIndex'])->name('admin.user-reviews');
    });

    // Department portals — each staff member reaches only their own portal
    // ('portal:<dept>'); admins may open any. Inertia/React pages under
    // resources/js/pages/portal/ rendered through DashboardLayout.
    Route::prefix('portal')->group(function () {
        Route::get('/', fn () => redirect(auth()->user()->homeRoute()))->name('portal');

        // "My Tickets" — every department staffer's own system-ticket list.
        // One route for all portals: the controller picks the per-role page
        // so it wraps in that staffer's layout (admins redirect to the board).
        Route::get('/tickets', [\App\Http\Controllers\SystemTicketController::class, 'myTickets'])->name('portal.tickets');

        // Sales portal — leads pipeline + consultation bookings.
        Route::middleware('portal:sales')->prefix('sales')->name('portal.sales.')->group(function () {
            Route::get('/dashboard', [SalesController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads', [SalesController::class, 'leads'])->name('leads');

            // Events tab — registrants for one event.
            //   /registrations → JSON (legacy; still used elsewhere)
            //   /registrants   → full-page Inertia render (Leads.jsx links here)
            Route::get('/events/{id}/registrations', [SalesController::class, 'eventRegistrations'])->name('events.registrations');
            Route::get('/events/{id}/registrants', [SalesController::class, 'eventRegistrantsPage'])->name('events.registrants');

            // Bulk email (Build 11.A) — preview + send to the selected leads.
            // Declared before /leads/{id} so the two static segments win.
            Route::post('/leads/bulk-email/preview', [\App\Http\Controllers\Sales\BulkEmailController::class, 'preview'])->name('leads.bulk-email.preview');
            Route::post('/leads/bulk-email/send', [\App\Http\Controllers\Sales\BulkEmailController::class, 'send'])->name('leads.bulk-email.send');

            Route::post('/leads', [SalesController::class, 'storeLead'])->name('leads.store');
            Route::post('/leads/{id}/notes', [\App\Http\Controllers\LeadNoteController::class, 'store'])->name('leads.notes.store');
            Route::post('/leads/{id}', [SalesController::class, 'updateLead'])->name('leads.update');
            Route::get('/bookings', [SalesController::class, 'bookings'])->name('bookings');
            Route::post('/bookings/{id}', [SalesController::class, 'updateBooking'])->name('bookings.update');

            // Programs catalogue — sales can add / edit / remove, same shared
            // ProgramController as education + admin (each action redirects back).
            Route::get('/programs', [SalesController::class, 'programs'])->name('programs');
            Route::post('/programs', [ProgramController::class, 'store'])->name('programs.store');
            Route::post('/programs/{id}', [ProgramController::class, 'update'])->name('programs.update');
            Route::delete('/programs/{id}', [ProgramController::class, 'destroy'])->name('programs.destroy');

            // Sales initiates portal access; admin must approve (see admin routes).
            Route::post('/leads/{id}/portal-invitation/request', [LeadPortalInvitationController::class, 'request'])
                ->name('leads.portal-invitation.request');

            // Tasks due-today widget feed for the sales dashboard.
            Route::get('/tasks/due-today', [\App\Http\Controllers\LeadTaskController::class, 'dueToday'])
                ->name('tasks.due-today');

            // Tasks & Follow-ups — central inbox of every open task across leads.
            Route::get('/tasks', [SalesController::class, 'tasks'])->name('tasks');

            // Sales Weekly Report — 11 sections; ?week_start=YYYY-MM-DD steps weeks.
            Route::get('/reports', [SalesController::class, 'report'])->name('reports');

            // Public assessment submissions (free-assessment + education-enrolment).
            Route::get('/assessments', [SalesController::class, 'assessments'])->name('assessments');

            // OUTREACH — /email-templates is served by MessageTemplateController
            // (department-scoped, registered above for every portal). Bulk email
            // (compose / schedule / history) is the BulkEmailController.
            Route::get('/bulk-email', [\App\Http\Controllers\BulkEmailController::class, 'index'])->name('bulk-email');
            Route::post('/bulk-email', [\App\Http\Controllers\BulkEmailController::class, 'store'])->name('bulk-email.store');
            Route::get('/bulk-email/{id}', [\App\Http\Controllers\BulkEmailController::class, 'show'])->name('bulk-email.show');
            Route::post('/bulk-email/{id}/cancel', [\App\Http\Controllers\BulkEmailController::class, 'cancel'])->name('bulk-email.cancel');
            Route::get('/campaigns', [SalesController::class, 'campaigns'])->name('campaigns');

            // ACCOUNT
            Route::get('/profile', [SalesController::class, 'profile'])->name('profile');
            Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');

            // Portal-scoped lead detail URL (sales user lands at /portal/sales/leads/{id})
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');
        });

        // Other portals — each has its own controller + dedicated dashboard
        // page. Admins satisfy every portal:* check via canAccessPortal(), so
        // they can view any role's dashboard.
        Route::middleware('portal:education')->prefix('education')->name('portal.education.')->group(function () {
            Route::get('/dashboard', [EducationController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads', [EducationController::class, 'leads'])->name('leads');
            // Events tab — registrants for one event (JSON drawer), same as sales.
            Route::get('/events/{id}/registrations', [EducationController::class, 'eventRegistrations'])->name('events.registrations');
            Route::post('/leads', [EducationController::class, 'storeLead'])->name('leads.store');
            Route::post('/leads/{id}/notes', [\App\Http\Controllers\LeadNoteController::class, 'store'])->name('leads.notes.store');
            Route::post('/leads/{id}', [EducationController::class, 'updateLead'])->name('leads.update');
            Route::post('/leads/{id}/portal-invitation/request', [LeadPortalInvitationController::class, 'request'])
                ->name('leads.portal-invitation.request');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');

            // WORK
            Route::get('/students', [EducationController::class, 'students'])->name('students');
            Route::post('/students/{id}/dashboard-field', [EducationController::class, 'updateStudentField'])->name('students.dashboard-field');
            // Add / edit / soft-delete student rows from the Students page.
            Route::post('/students', [EducationController::class, 'storeStudent'])->name('students.store');
            Route::post('/students/{id}/update', [EducationController::class, 'updateStudent'])->name('students.update');
            Route::post('/students/{id}/destroy', [EducationController::class, 'destroyStudent'])->name('students.destroy');
            // Schools catalog — same SchoolController as /admin/schools,
            // but routed under the education prefix so the page wraps in
            // EducationLayout instead of AdminLayout.
            Route::get('/schools', [\App\Http\Controllers\SchoolController::class, 'index'])->name('schools');
            Route::get('/documents', [EducationController::class, 'documents'])->name('documents');
            // Public assessment submissions (free-assessment + education-enrolment).
            Route::get('/assessments', [EducationController::class, 'assessments'])->name('assessments');
            // Tasks & follow-ups (mirror of /portal/sales/tasks). Reuses
            // LeadTaskController::dueToday for the AJAX endpoint since
            // tasks are not department-scoped server-side.
            Route::get('/tasks/due-today', [\App\Http\Controllers\LeadTaskController::class, 'dueToday'])
                ->name('tasks.due-today');
            Route::get('/tasks', [EducationController::class, 'tasks'])->name('tasks');

            // SETUP
            Route::get('/programs', [EducationController::class, 'programs'])->name('programs');
            // Education staff can add / edit / remove programs from their portal
            // — same ProgramController as admin (each action redirects back),
            // just reachable under the education prefix.
            Route::post('/programs', [ProgramController::class, 'store'])->name('programs.store');
            Route::post('/programs/{id}', [ProgramController::class, 'update'])->name('programs.update');
            Route::delete('/programs/{id}', [ProgramController::class, 'destroy'])->name('programs.destroy');
            Route::get('/checklist-templates', [EducationController::class, 'checklistTemplates'])->name('checklist-templates');

            // REPORTS — single page; period (weekly|monthly|quarterly|custom)
            // is a query param, sections stay the same.
            Route::get('/reports', [EducationController::class, 'reports'])->name('reports');

            // ACCOUNT
            Route::get('/profile', [EducationController::class, 'profile'])->name('profile');
            Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
        });

        Route::middleware('portal:english')->prefix('english')->name('portal.english.')->group(function () {
            Route::get('/dashboard', [EnglishController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');

            // English learners — leads flagged is_english_student.
            Route::get('/learners', [EnglishController::class, 'learners'])->name('learners');

            // English classes — group sessions with learner enrollment.
            Route::get('/classes', [EnglishController::class, 'classes'])->name('classes');
            Route::post('/classes', [EnglishController::class, 'storeClass'])->name('classes.store');
            Route::get('/classes/{id}', [EnglishController::class, 'showClass'])->name('classes.show');
            Route::put('/classes/{id}', [EnglishController::class, 'updateClass'])->name('classes.update');
            Route::delete('/classes/{id}', [EnglishController::class, 'destroyClass'])->name('classes.destroy');
            Route::post('/classes/{id}/enroll', [EnglishController::class, 'enrollLearner'])->name('classes.enroll');
            Route::delete('/classes/{id}/enroll/{enrollmentId}', [EnglishController::class, 'withdrawLearner'])->name('classes.withdraw');

            // English assessments — mock / official test score records.
            Route::get('/assessments', [EnglishController::class, 'assessments'])->name('assessments');
            Route::post('/assessments', [EnglishController::class, 'storeAssessment'])->name('assessments.store');
            Route::get('/assessments/{id}', [EnglishController::class, 'showAssessment'])->name('assessments.show');
            Route::put('/assessments/{id}', [EnglishController::class, 'updateAssessment'])->name('assessments.update');
            Route::delete('/assessments/{id}', [EnglishController::class, 'destroyAssessment'])->name('assessments.destroy');
        });

        Route::middleware('portal:immigration')->prefix('immigration')->name('portal.immigration.')->group(function () {
            Route::get('/dashboard', [ImmigrationController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads', [ImmigrationController::class, 'leads'])->name('leads');
            // Events tab — registrants for one event (JSON drawer), same as sales.
            Route::get('/events/{id}/registrations', [ImmigrationController::class, 'eventRegistrations'])->name('events.registrations');
            Route::post('/leads/{id}', [ImmigrationController::class, 'updateLead'])->name('leads.update');
            Route::post('/leads/{id}/portal-invitation/request', [LeadPortalInvitationController::class, 'request'])
                ->name('leads.portal-invitation.request');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');

            // WORK
            Route::get('/assessments', [ImmigrationController::class, 'assessments'])->name('assessments');
            // Per-intake detail page — covers Work / Student / Visitor.
            // Resident intakes use the dedicated /admin/immigration/
            // resident-intakes/{id} route (richer document handling).
            Route::get('/intakes/{type}/{id}', [ImmigrationController::class, 'showIntake'])
                ->where(['type' => 'work|student|visitor', 'id' => '[0-9]+'])
                ->name('intakes.show');
            // Convert a visa-interest submission to an immigration case.
            // The {id} route param is Assessment.id (post-Phase-B
            // canonical). The controller also accepts a legacy
            // ResidentIntake.id for backward compat — any pre-Phase-B
            // bookmark that POSTed an intake id still resolves cleanly.
            Route::post('/assessments/{id}/convert-to-case', [ImmigrationController::class, 'convertAssessmentToCase'])->name('assessments.convert');
            Route::get('/cases', [ImmigrationController::class, 'cases'])->name('cases');
            // Create new case from the Cases page "Add new case" modal.
            Route::post('/cases', [ImmigrationController::class, 'storeCase'])->name('cases.store');
            // Edit an existing case (same modal fields as create).
            Route::post('/cases/{id}', [ImmigrationController::class, 'updateCase'])->name('cases.update');
            // Inline stage update from the Cases table — mirrors the
            // EducationController dashboard-field pattern.
            Route::post('/cases/{id}/stage', [ImmigrationController::class, 'updateCaseStage'])->name('cases.stage');
            // Inline visa-type update from the Cases table.
            Route::post('/cases/{id}/visa', [ImmigrationController::class, 'updateCaseVisa'])->name('cases.visa');
            // Inline priority update from the Cases table's expanded row.
            Route::post('/cases/{id}/priority', [ImmigrationController::class, 'updateCasePriority'])->name('cases.priority');

            // Build 11.D — purpose-built Case Profile page. The {lead} binding
            // is the Lead model; controller hard-404s when is_immigration_case
            // is false so this endpoint stays case-only. Sales leads continue
            // to use LeadController::show via /admin/leads/{id}.
            Route::get('/cases/{lead}/profile', [\App\Http\Controllers\Immigration\CaseProfileController::class, 'show'])
                ->name('cases.profile');
            // Edit the applicant's personal details from the Case Profile "Personal" tab.
            Route::post('/cases/{lead}/personal', [\App\Http\Controllers\Immigration\CaseProfileController::class, 'updatePersonal'])
                ->name('cases.personal');

            // Build 11.D Phase 2 — Managed agreement endpoints. Each call
            // re-checks is_immigration_case + agreement<->lead ownership so
            // a cross-case URL guess still 404s. The route order matters:
            // /agreements/templates must come before /agreements/{agreement}
            // or the literal 'templates' would be captured as an Agreement id.
            Route::prefix('cases/{lead}/agreements')->name('cases.agreements.')->group(function () {
                Route::get('/',                       [\App\Http\Controllers\Immigration\AgreementController::class, 'index'])->name('index');
                Route::get('/templates',              [\App\Http\Controllers\Immigration\AgreementController::class, 'templates'])->name('templates');
                Route::post('/',                      [\App\Http\Controllers\Immigration\AgreementController::class, 'generate'])->name('generate');
                Route::post('/{agreement}/send',      [\App\Http\Controllers\Immigration\AgreementController::class, 'send'])->name('send');
                Route::get('/{agreement}/pdf',        [\App\Http\Controllers\Immigration\AgreementController::class, 'downloadPdf'])->name('pdf');
                Route::post('/{agreement}/void',      [\App\Http\Controllers\Immigration\AgreementController::class, 'void'])->name('void');
            });
            Route::get('/documents', [ImmigrationController::class, 'documents'])->name('documents');
            Route::get('/appointments', [ImmigrationController::class, 'appointments'])->name('appointments');

            // SETUP — visa types are managed through VisaTypeController so
            // the same logic (policy, audit, notifications) applies to both
            // admin staff and immigration managers/advisers.
            Route::get('/visa-types', [VisaTypeController::class, 'index'])->name('visa-types');
            Route::get('/visa-types/templates', [VisaTypeController::class, 'checklistTemplates'])->name('visa-types.templates');
            Route::post('/visa-types', [VisaTypeController::class, 'store'])->name('visa-types.store');
            Route::post('/visa-types/{visa_type}', [VisaTypeController::class, 'update'])->name('visa-types.update');
            Route::delete('/visa-types/{visa_type}', [VisaTypeController::class, 'destroy'])->name('visa-types.destroy');
            Route::get('/visa-types/{visa_type}/price-history', [VisaTypeController::class, 'priceHistory'])->name('visa-types.price-history');
            Route::get('/intakes', [ImmigrationController::class, 'intakes'])->name('intakes');
            Route::get('/inz-forms', [ImmigrationController::class, 'inzForms'])->name('inz-forms');
            Route::get('/checklist-templates', [ImmigrationController::class, 'checklistTemplates'])->name('checklist-templates');

            // Task Board — shared TaskBoardPage component (see resources/js/
            // components/task-board/TaskBoardPage.jsx).
            Route::get('/tasks', [ImmigrationController::class, 'tasks'])->name('tasks');

            // REPORTS
            Route::get('/reports', [ImmigrationController::class, 'reports'])->name('reports');

            // ACCOUNT
            Route::get('/profile', [ImmigrationController::class, 'profile'])->name('profile');
            Route::post('/profile', [ImmigrationController::class, 'updateProfile'])->name('profile.update');
            Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
        });

        Route::middleware('portal:accommodation')->prefix('accommodation')->name('portal.accommodation.')->group(function () {
            Route::get('/dashboard', [AccommodationController::class, 'dashboard'])->name('dashboard');
            Route::get('/tasks', [AccommodationController::class, 'tasks'])->name('tasks');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');

            // Property CRUD (multipart: update is POST + _method=PUT). Public
            // listing fields + internal management record share one model.
            // Literal paths (create, export) are declared before /{property}.
            Route::get('/properties', [PropertyController::class, 'index'])->name('properties.index');
            Route::get('/properties/create', [PropertyController::class, 'create'])->name('properties.create');
            Route::get('/properties/export', [PropertyController::class, 'export'])->name('properties.export');
            Route::post('/properties', [PropertyController::class, 'store'])->name('properties.store');
            Route::get('/properties/{property}', [PropertyController::class, 'show'])->name('properties.show');
            Route::get('/properties/{property}/edit', [PropertyController::class, 'edit'])->name('properties.edit');
            Route::match(['POST', 'PUT'], '/properties/{property}', [PropertyController::class, 'update'])->name('properties.update');
            Route::patch('/properties/{property}/archive', [PropertyController::class, 'archive'])->name('properties.archive');
            Route::delete('/properties/{property}', [PropertyController::class, 'destroy'])->name('properties.destroy');
            Route::delete('/properties/{property}/images/{image}', [PropertyController::class, 'destroyImage'])->name('properties.images.destroy');

            // Tenants — CRUD + lifecycle actions. Literal /export must precede
            // the resource so it isn't captured as /tenants/{tenant}.
            Route::get('/tenants/export', [TenantController::class, 'export'])->name('tenants.export');
            Route::post('/tenants/{tenant}/notice', [TenantController::class, 'markNoticeGiven'])->name('tenants.notice');
            Route::post('/tenants/{tenant}/vacate', [TenantController::class, 'markVacated'])->name('tenants.vacate');
            Route::post('/tenants/{tenant}/renew', [TenantController::class, 'markRenewed'])->name('tenants.renew');
            Route::post('/tenants/{tenant}/move', [TenantController::class, 'moveToProperty'])->name('tenants.move');
            Route::patch('/tenants/{tenant}/archive', [TenantController::class, 'archive'])->name('tenants.archive');
            Route::patch('/tenants/{tenant}/restore', [TenantController::class, 'restore'])->name('tenants.restore')->withTrashed();
            Route::resource('tenants', TenantController::class);

            // Onboarding pipeline (EOI submissions). Route NAMES stay
            // `applications.*` to match the model/controller; the canonical URL
            // is /onboarding, with /applications kept as a backwards-compat alias.
            Route::get('/onboarding', [EoiSubmissionController::class, 'index'])->name('onboarding');
            Route::get('/applications', [EoiSubmissionController::class, 'index'])->name('applications.index');
            Route::get('/applications/{submission}', [EoiSubmissionController::class, 'show'])->name('applications.show');
            Route::patch('/applications/{submission}/status', [EoiSubmissionController::class, 'updateStatus'])->name('applications.update-status');
            Route::post('/applications/{submission}/assign', [EoiSubmissionController::class, 'assignTo'])->name('applications.assign');
            Route::post('/applications/{submission}/link-property', [EoiSubmissionController::class, 'linkToProperty'])->name('applications.link-property');
            Route::post('/applications/{submission}/note', [EoiSubmissionController::class, 'addInternalNote'])->name('applications.note');
            Route::post('/applications/{submission}/convert', [EoiSubmissionController::class, 'convertToTenant'])->name('applications.convert');
            Route::delete('/applications/{submission}', [EoiSubmissionController::class, 'destroy'])->name('applications.destroy');

            // ----------------------------------------------------------------
            // Scaffolded sections — sidebar nav is live, real features ship
            // incrementally. Each points at the shared Placeholder page until
            // its controller/model/pages are built.
            // ----------------------------------------------------------------
            $stub = fn (string $title, string $description) => fn () => inertia('portal/accommodation/Placeholder', compact('title', 'description'));

            // Work (Tenants + Onboarding + Calendar are real above; Task Tracker
            // uses the shared Task Board; the rest are scaffolded placeholders).
            // Calendar consolidates the old Viewers & Contract-End screens and
            // unifies events from several sources (events endpoint returns JSON).
            Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar');
            Route::get('/calendar/events', [CalendarController::class, 'events'])->name('calendar.events');
            Route::post('/calendar/events', [CalendarController::class, 'storeCustomEvent'])->name('calendar.events.store');
            Route::patch('/calendar/events/{event}', [CalendarController::class, 'updateCustomEvent'])->name('calendar.events.update');
            Route::delete('/calendar/events/{event}', [CalendarController::class, 'destroyCustomEvent'])->name('calendar.events.destroy');
            Route::get('/rent-utilities', [RentUtilitiesController::class, 'index'])->name('rent-utilities');
            Route::patch('/rent-utilities/tenants/{tenant}/payment', [RentUtilitiesController::class, 'savePayment'])->name('rent-utilities.payment');
            Route::patch('/rent-utilities/tenants/{tenant}/rent', [RentUtilitiesController::class, 'saveRentUtilities'])->name('rent-utilities.rent');
            Route::get('/payment-schedule', [PaymentScheduleController::class, 'index'])->name('payment-schedule');
            Route::get('/gas-delivery', [GasDeliveryController::class, 'index'])->name('gas-delivery');
            Route::get('/concerns', [App\Http\Controllers\ConcernController::class, 'index'])->name('concerns');
            Route::patch('/concerns/{concern}', [App\Http\Controllers\ConcernController::class, 'update'])->name('concerns.update');
            Route::get('/message-templates', [MessageTemplateController::class, 'index'])->name('message-templates');
            Route::post('/message-templates', [MessageTemplateController::class, 'store'])->name('message-templates.store');
            Route::patch('/message-templates/{template}', [MessageTemplateController::class, 'update'])->name('message-templates.update');
            Route::delete('/message-templates/{template}', [MessageTemplateController::class, 'destroy'])->name('message-templates.destroy');

            // Reports & Account
            Route::get('/reports', $stub('Reports', 'Weekly, monthly, quarterly and custom reports.'))->name('reports');
            Route::get('/profile', $stub('My Profile', 'Your account details and preferences.'))->name('profile');
            Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications');
        });

        // Finance portal — placeholder dashboard + cross-portal Task Board
        // filtered to department='finance'. Sidebar is intentionally lean
        // (Dashboard + Task Board only) until the payments/invoices data
        // model lands.
        Route::middleware('portal:finance')->prefix('finance')->name('portal.finance.')->group(function () {
            Route::get('/dashboard', [\App\Http\Controllers\Portal\FinanceController::class, 'dashboard'])->name('dashboard');
            Route::get('/tasks', [\App\Http\Controllers\Portal\FinanceController::class, 'tasks'])->name('tasks');
        });

        // Lead Portal — external client-facing dashboard. Each lead-role user
        // is scoped to their own Lead record.
        Route::middleware('portal:lead')->prefix('lead')->name('portal.lead.')->group(function () {
            Route::get('/dashboard', [App\Http\Controllers\LeadPortalController::class, 'dashboard'])->name('dashboard');
            Route::get('/submissions', [App\Http\Controllers\LeadPortalController::class, 'submissions'])->name('submissions');
            Route::get('/activities', [App\Http\Controllers\LeadPortalController::class, 'activities'])->name('activities');
            Route::get('/announcements', [App\Http\Controllers\LeadPortalController::class, 'announcements'])->name('announcements');

            // New sidebar sections — most are placeholders while the full
            // workflow ships incrementally.
            Route::get('/journey', [App\Http\Controllers\LeadPortalController::class, 'journey'])->name('journey');
            Route::get('/checklist', [App\Http\Controllers\LeadPortalController::class, 'checklist'])->name('checklist');
            Route::get('/visa-forms', [App\Http\Controllers\LeadPortalController::class, 'visaForms'])->name('visa-forms');
            Route::get('/appointments', [App\Http\Controllers\LeadPortalController::class, 'appointments'])->name('appointments');
            Route::get('/proposals', [App\Http\Controllers\LeadPortalController::class, 'proposals'])->name('proposals');
            Route::get('/agreements', [App\Http\Controllers\LeadPortalController::class, 'agreements'])->name('agreements');
            Route::get('/payments', [App\Http\Controllers\LeadPortalController::class, 'payments'])->name('payments');
            Route::get('/messages', [App\Http\Controllers\LeadPortalController::class, 'messages'])->name('messages');
            Route::get('/profile', [App\Http\Controllers\LeadPortalController::class, 'profile'])->name('profile');
            Route::get('/settings', [App\Http\Controllers\LeadPortalController::class, 'settings'])->name('settings');
            Route::get('/documents', [LeadDocumentController::class, 'leadIndex'])->name('documents');
            Route::post('/documents/upload', [LeadDocumentController::class, 'leadUpload'])->name('documents.upload');
            Route::post('/documents/checklist/{key}/upload', [LeadDocumentController::class, 'leadChecklistUpload'])->name('documents.checklist.upload');
            Route::post('/documents/section/{key}/submit', [LeadDocumentController::class, 'leadSubmitSection'])->name('documents.section.submit');
            // Lead ticks "I've read and agreed to the Consultancy + English
            // Engagement Agreement terms" — sets / clears the timestamp.
            Route::post('/documents/agreements/acknowledge', [LeadDocumentController::class, 'leadAcknowledgeAgreements'])->name('documents.agreements.acknowledge');
            Route::get('/documents/{docId}/download', [LeadDocumentController::class, 'download'])->name('documents.download');
        });
    });
});
