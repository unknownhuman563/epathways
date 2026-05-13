<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\Portal\SalesController;
use App\Http\Controllers\ResidentIntakeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserReviewController;
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
   return inertia('immigration/ImmigrationPage');
});

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

Route::get("/resident-intake", [ResidentIntakeController::class, 'showForm'])->name('resident-intake');
Route::post("/resident-intake", [ResidentIntakeController::class, 'store']);

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

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login')->middleware('guest');
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

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
        Route::get("/admin/leads/{id}", [LeadController::class, 'show'])->name('admin.leads.show');
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

        Route::get('/admin/immigration/resident-intakes', [ResidentIntakeController::class, 'adminIndex'])->name('admin.immigration.resident-intakes');
        Route::get('/admin/immigration/resident-intakes/{id}', [ResidentIntakeController::class, 'adminShow'])->name('admin.immigration.resident-intakes.show');
        Route::get('/admin/immigration/resident-intakes/{id}/documents/{key}/{index?}', [ResidentIntakeController::class, 'downloadDocument'])->name('admin.immigration.resident-intakes.document');

        Route::get('/admin/immigration/user-reviews', [UserReviewController::class, 'adminIndex'])->name('admin.immigration.user-reviews');
        Route::get('/admin/immigration/user-reviews/{id}', [UserReviewController::class, 'adminShow'])->name('admin.immigration.user-reviews.show');

        Route::get("/admin/booking", [BookingController::class, 'index'])->name('admin.bookings');
        Route::post("/admin/bookings/{id}", [BookingController::class, 'update']);

        Route::get('/admin/users', [UserController::class, 'index'])->name('admin.users');
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::post('/admin/users/{id}', [UserController::class, 'update']);
        Route::delete('/admin/users/{id}', [UserController::class, 'destroy']);

        Route::get('/admin/activity-logs', [ActivityLogController::class, 'index'])->name('admin.activity-logs');
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
        });

        // Other portals — scaffold dashboards for now (generic Inertia page).
        Route::get('/education/dashboard', fn () => inertia('portal/Dashboard', ['portal' => 'education']))
            ->middleware('portal:education')->name('portal.education');
        Route::get('/english/dashboard', fn () => inertia('portal/Dashboard', ['portal' => 'english']))
            ->middleware('portal:english')->name('portal.english');
        Route::get('/immigration/dashboard', fn () => inertia('portal/Dashboard', ['portal' => 'immigration']))
            ->middleware('portal:immigration')->name('portal.immigration');
        Route::get('/accommodation/dashboard', fn () => inertia('portal/Dashboard', ['portal' => 'accommodation']))
            ->middleware('portal:accommodation')->name('portal.accommodation');
    });
});

