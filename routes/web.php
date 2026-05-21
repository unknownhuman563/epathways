<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\QuickLeadController;
use App\Http\Controllers\Portal\ImmigrationController as PortalImmigrationController;
use App\Http\Controllers\Portal\SalesController;
use App\Http\Controllers\Portal\EducationController;
use App\Http\Controllers\Portal\EnglishController;
use App\Http\Controllers\Portal\ImmigrationController;
use App\Http\Controllers\Portal\AccommodationController;
use App\Http\Controllers\ResidentIntakeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserReviewController;
use App\Http\Controllers\LeadPortalInvitationController;
use App\Http\Controllers\LeadDocumentController;
use App\Services\NewsFeedService;
Route::get('/', [HomeController::class, 'index']);

Route::get("/booking", function (){
   return inertia('booking/BookingPage');
});
Route::post("/bookings", [BookingController::class, 'store']);


Route::get("/education-journey", function (){
   return inertia('education-journey/EducationJourneyPage');
});

Route::get('/programs-levels', [ProgramController::class, 'publicIndex']);
Route::get('/program-details/{program}', [ProgramController::class, 'publicShow']);

Route::get('/fee-guide', [ProgramController::class, 'feeGuideIndex']);

Route::get("/about-us", function (){
   return inertia('about-us/AboutUsPage');
});

Route::get("/immigration", function (){
   return inertia('immigration/ImmigrationPage', array_merge(
       UserReviewController::publicPayload(),
       ['news' => NewsFeedService::latest(3)]
   ));
});

// Admin moderation toggle for published / featured / status on a review.
Route::middleware('auth')->post('/admin/immigration/user-reviews/{id}', [UserReviewController::class, 'adminUpdate'])
    ->name('admin.immigration.user-reviews.update');

Route::get("/accommodation", function (){
   return inertia('accommodation/AccommodationPage');
});

Route::get("/accommodation/{id}", function ($id){
   return inertia('accommodation/PropertyDetails', ['id' => $id]);
});

Route::get("/accommodation/{id}/checkout", function ($id){
   return inertia('accommodation/Checkout', ['id' => $id]);
});

Route::get("/coming-soon", function (){
   return inertia('coming-soon/ComingSoonPage');
});
Route::get("/immigration-assessment", function (){
   return inertia('visa/ImmigrationAssessment');
});

Route::get("/visa-assessment-form", function (){
   return inertia('visa/VisaAssessmentForm');
});

Route::get("/resident-interest", [ResidentIntakeController::class, 'showForm'])->name('resident-interest');
Route::post("/resident-interest", [ResidentIntakeController::class, 'store']);

// Token-based edit links (no auth — the opaque token is the bearer credential).
Route::get('/resident-interest/edit/{token}', [ResidentIntakeController::class, 'showEditForm'])->name('resident-interest.edit');
Route::post('/resident-interest/edit/{token}', [ResidentIntakeController::class, 'updateFromEditLink']);

// Keep the old path working for any in-flight bookmarks / external links.
Route::permanentRedirect('/resident-intake', '/resident-interest');

Route::post('/user-reviews', [UserReviewController::class, 'store'])->name('user-reviews.store');

Route::get('/activities', [EventController::class, 'activities']);

Route::get("/visa-approved", function (){
   return inertia('visa/VisaApproved');
});

// Public Registration & Assessment Routes
Route::get('/register/{event_code}', [EventController::class, 'showRegistrationForm']);
Route::post('/register/{event_code}', [EventController::class, 'registerLead']);
Route::get('/free-assessment', [LeadController::class, 'showFreeAssessment'])->name('free-assessment');
Route::post('/free-assessment', [LeadController::class, 'storeFreeAssessment']);
Route::get('/assessment-result/{lead_id}', [LeadController::class, 'showAssessmentResult'])->name('assessment-result');

// Lightweight inline lead capture (hero, exit-intent, fee-guide download,
// footer newsletter, etc.) — writes into the same `leads` table with
// source-tagging so the sales pipeline sees one funnel.
Route::post('/quick-lead', [QuickLeadController::class, 'store'])->name('quick-lead');

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Lead Portal account setup — the invitation token itself acts as auth,
// so these routes sit outside the auth middleware.
Route::get('/lead-portal/setup/{token}', [LeadPortalInvitationController::class, 'setup'])
    ->name('lead-portal.setup')->middleware('guest');
Route::post('/lead-portal/setup/{token}', [LeadPortalInvitationController::class, 'store'])
    ->middleware('guest');

// External calendar sync — self-authenticates via the X-Sync-Token header
// (see SyncController), so it must sit OUTSIDE the auth/admin group.
Route::post("/api/sync-calendar", [App\Http\Controllers\SyncController::class, 'syncCalendar']);

// Authenticated areas — every staff user must be logged in ('auth'); role
// middleware nested below narrows each section ('portal:admin', 'portal:sales', …).
Route::middleware(['auth'])->group(function () {

    // Admin area — admin role only; department-portal staff are kept out by 'portal:admin'.
    Route::middleware('portal:admin')->group(function () {
        Route::redirect('/admin', '/admin/dashboard');
        Route::get("/admin/dashboard", function (){
           return inertia('admin/Dashboard');
        });
        Route::get("/admin/leads", [LeadController::class, 'index'])->name('admin.leads');
        Route::get("/admin/events", [EventController::class, 'index'])->name('admin.events');
        Route::post('/admin/events', [EventController::class, 'store']);
        Route::get('/admin/events/{id}', [EventController::class, 'show'])->name('admin.events.show');

        Route::get('/admin/programs', [ProgramController::class, 'index'])->name('admin.programs');
        Route::get('/admin/facebook-live', [App\Http\Controllers\FacebookLiveController::class, 'index'])->name('admin.facebook-live');
        Route::post('/admin/facebook-live', [App\Http\Controllers\FacebookLiveController::class, 'store']);
        Route::post('/admin/facebook-live/{id}', [App\Http\Controllers\FacebookLiveController::class, 'update']);
        Route::delete('/admin/facebook-live/{id}', [App\Http\Controllers\FacebookLiveController::class, 'destroy']);
        Route::post('/admin/programs', [ProgramController::class, 'store']);
        Route::post('/admin/programs/{id}', [ProgramController::class, 'update']);
        Route::delete('/admin/programs/{id}', [ProgramController::class, 'destroy']);

        Route::get("/admin/booking", [BookingController::class, 'index'])->name('admin.bookings');
        Route::post("/admin/bookings/{id}", [BookingController::class, 'update']);

        Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users');
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::post('/admin/users/{id}', [UserController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);

        Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])->name('admin.activity-logs');

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

    // Lead detail view + stage update — any logged-in staff (admin OR any
    // department portal) can view a lead and advance its pipeline stage.
    // Every change is audited via the LogsActivity trait on the Lead model.
    Route::middleware('portal:admin,sales,education,english,immigration,accommodation')->group(function () {
        Route::get("/admin/leads/{id}", [LeadController::class, 'show'])->name('admin.leads.show');
        Route::post('/admin/leads/{id}/stage', [LeadController::class, 'updateStage'])->name('admin.leads.stage');
        Route::post('/admin/leads/{id}/journey', [LeadController::class, 'updateJourney'])->name('admin.leads.journey');
        Route::post('/admin/leads/{id}/documents/checklist', [LeadController::class, 'updateDocumentChecklist'])->name('admin.leads.documents.checklist');
        Route::post('/admin/leads/{id}/documents/section-verification', [LeadController::class, 'updateSectionVerification'])->name('admin.leads.documents.section-verification');

        // Internal notes — any staff role can add, only author or admin can edit/delete.
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
    // own upload routes are under the lead-portal group below.
    Route::middleware('portal:admin,sales')->group(function () {
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
        // Staff download — same controller, role-gated inside.
        Route::get('/admin/documents/{docId}/download', [LeadDocumentController::class, 'download'])
            ->name('admin.documents.download');
    });

    // Documents-tab checklist uploads + per-file delete — wider group so
    // every department portal that sees the tab can also manage files.
    Route::middleware('portal:admin,sales,education,english,immigration,accommodation')->group(function () {
        Route::post('/admin/leads/{id}/documents/checklist/{key}/upload', [LeadDocumentController::class, 'staffChecklistUpload'])
            ->name('admin.leads.documents.checklist.upload');
        Route::delete('/admin/leads/{leadId}/documents/{docId}', [LeadDocumentController::class, 'destroyDocument'])
            ->name('admin.leads.documents.destroy');
    });

    // Immigration management screens — shared between admins and immigration-role staff.
    // They live under /admin/immigration/... for historical reasons; the immigration
    // portal's sidebar deep-links here.
    Route::middleware('portal:admin,immigration')->group(function () {
        Route::get('/admin/immigration/resident-intakes', [ResidentIntakeController::class, 'adminIndex'])->name('admin.immigration.resident-intakes');
        Route::get('/admin/immigration/resident-intakes/{id}', [ResidentIntakeController::class, 'adminShow'])->name('admin.immigration.resident-intakes.show');
        Route::get('/admin/immigration/resident-intakes/{id}/documents/{key}/{index?}', [ResidentIntakeController::class, 'downloadDocument'])->name('admin.immigration.resident-intakes.document');
        Route::post('/admin/immigration/resident-intakes/{id}/edit-link', [ResidentIntakeController::class, 'generateEditLink'])->name('admin.immigration.resident-intakes.edit-link');

        Route::get('/admin/immigration/user-reviews', [UserReviewController::class, 'adminIndex'])->name('admin.immigration.user-reviews');
        Route::get('/admin/immigration/user-reviews/{id}', [UserReviewController::class, 'adminShow'])->name('admin.immigration.user-reviews.show');
    });

    // Department portals — each staff member reaches only their own portal
    // ('portal:<dept>'); admins may open any. Inertia/React pages under
    // resources/js/pages/portal/ rendered through DashboardLayout.
    Route::prefix('portal')->group(function () {
        Route::get('/', fn () => redirect(auth()->user()->homeRoute()))->name('portal');

        // Sales portal — leads pipeline + consultation bookings.
        Route::middleware('portal:sales')->prefix('sales')->name('portal.sales.')->group(function () {
            Route::get('/dashboard', [SalesController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads', [SalesController::class, 'leads'])->name('leads');
            Route::post('/leads/{id}', [SalesController::class, 'updateLead'])->name('leads.update');
            Route::get('/bookings', [SalesController::class, 'bookings'])->name('bookings');
            Route::post('/bookings/{id}', [SalesController::class, 'updateBooking'])->name('bookings.update');

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

            // OUTREACH — placeholders until the email backbone ships.
            Route::get('/bulk-email',      [SalesController::class, 'bulkEmail'])->name('bulk-email');
            Route::get('/email-templates', [SalesController::class, 'emailTemplates'])->name('email-templates');
            Route::get('/campaigns',       [SalesController::class, 'campaigns'])->name('campaigns');

            // ACCOUNT
            Route::get('/profile',       [SalesController::class, 'profile'])->name('profile');
            Route::get('/notifications', [SalesController::class, 'notifications'])->name('notifications');

            // Portal-scoped lead detail URL (sales user lands at /portal/sales/leads/{id})
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');
        });

        // Other portals — each has its own controller + dedicated dashboard
        // page. Admins satisfy every portal:* check via canAccessPortal(), so
        // they can view any role's dashboard.
        Route::middleware('portal:education')->prefix('education')->name('portal.education.')->group(function () {
            Route::get('/dashboard', [EducationController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads', [EducationController::class, 'leads'])->name('leads');
            Route::post('/leads/{id}', [EducationController::class, 'updateLead'])->name('leads.update');
            // Education staff can also request a Lead-Portal invitation; admin still approves.
            Route::post('/leads/{id}/portal-invitation/request', [LeadPortalInvitationController::class, 'request'])
                ->name('leads.portal-invitation.request');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');
        });

        Route::middleware('portal:english')->prefix('english')->name('portal.english.')->group(function () {
            Route::get('/dashboard', [EnglishController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');
        });

        Route::middleware('portal:immigration')->prefix('immigration')->name('portal.immigration.')->group(function () {
            Route::get('/dashboard', [ImmigrationController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads', [ImmigrationController::class, 'leads'])->name('leads');
            Route::post('/leads/{id}', [ImmigrationController::class, 'updateLead'])->name('leads.update');
            // Immigration staff can also request a Lead-Portal invitation; admin still approves.
            Route::post('/leads/{id}/portal-invitation/request', [LeadPortalInvitationController::class, 'request'])
                ->name('leads.portal-invitation.request');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');
        });

        Route::middleware('portal:accommodation')->prefix('accommodation')->name('portal.accommodation.')->group(function () {
            Route::get('/dashboard', [AccommodationController::class, 'dashboard'])->name('dashboard');
            Route::get('/leads/{id}', [LeadController::class, 'show'])->name('leads.show');
        });

        // Lead Portal — external client-facing dashboard. Each lead-role user
        // is scoped to their own Lead record.
        Route::middleware('portal:lead')->prefix('lead')->name('portal.lead.')->group(function () {
            Route::get('/dashboard',     [App\Http\Controllers\LeadPortalController::class, 'dashboard'])->name('dashboard');
            Route::get('/submissions',   [App\Http\Controllers\LeadPortalController::class, 'submissions'])->name('submissions');
            Route::get('/activities',    [App\Http\Controllers\LeadPortalController::class, 'activities'])->name('activities');
            Route::get('/announcements', [App\Http\Controllers\LeadPortalController::class, 'announcements'])->name('announcements');

            // New sidebar sections — most are placeholders while the full
            // workflow ships incrementally.
            Route::get('/journey',       [App\Http\Controllers\LeadPortalController::class, 'journey'])->name('journey');
            Route::get('/checklist',     [App\Http\Controllers\LeadPortalController::class, 'checklist'])->name('checklist');
            Route::get('/visa-forms',    [App\Http\Controllers\LeadPortalController::class, 'visaForms'])->name('visa-forms');
            Route::get('/appointments',  [App\Http\Controllers\LeadPortalController::class, 'appointments'])->name('appointments');
            Route::get('/proposals',     [App\Http\Controllers\LeadPortalController::class, 'proposals'])->name('proposals');
            Route::get('/agreements',    [App\Http\Controllers\LeadPortalController::class, 'agreements'])->name('agreements');
            Route::get('/payments',      [App\Http\Controllers\LeadPortalController::class, 'payments'])->name('payments');
            Route::get('/messages',      [App\Http\Controllers\LeadPortalController::class, 'messages'])->name('messages');
            Route::get('/profile',       [App\Http\Controllers\LeadPortalController::class, 'profile'])->name('profile');
            Route::get('/settings',      [App\Http\Controllers\LeadPortalController::class, 'settings'])->name('settings');
            Route::get('/documents',     [LeadDocumentController::class, 'leadIndex'])->name('documents');
            Route::post('/documents/upload', [LeadDocumentController::class, 'leadUpload'])->name('documents.upload');
            Route::post('/documents/checklist/{key}/upload', [LeadDocumentController::class, 'leadChecklistUpload'])->name('documents.checklist.upload');
            Route::post('/documents/section/{key}/submit', [LeadDocumentController::class, 'leadSubmitSection'])->name('documents.section.submit');
            Route::get('/documents/{docId}/download', [LeadDocumentController::class, 'download'])->name('documents.download');
        });
    });
});

