<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProgramController;
Route::get('/', function () {
    return inertia('home');
});

Route::get("/booking", function (){
   return inertia('bookingpage'); 
});
Route::post("/bookings", [BookingController::class, 'store']);


Route::get("/education-journey", function (){
   return inertia('EducationJourney'); 
});

Route::get('/programs-levels', [ProgramController::class, 'publicIndex']);
Route::get('/program-details/{id}', [ProgramController::class, 'publicShow']);

Route::get('/fee-guide', [ProgramController::class, 'feeGuideIndex']);

Route::get("/about-us", function (){
   return inertia('AboutUs'); 
});

Route::get("/immigration", function (){
   return inertia('Immigration'); 
});

Route::get("/coming-soon", function (){
   return inertia('ComingSoon'); 
});
Route::get("/immigration-assessment", function (){
   return inertia('ImmigrationAssessment'); 
});

Route::get("/visa-assessment-form", function (){
   return inertia('VisaAssessmentForm'); 
});

Route::get('/activities', [EventController::class, 'activities']);

Route::get("/visa-approved", function (){
   return inertia('VisaApproved'); 
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

// Admin Routes
Route::middleware(['auth'])->group(function () {
    Route::redirect('/admin', '/admin/dashboard');
    Route::get("/admin/dashboard", function (){
       return inertia('Admin/Dashboard'); 
    });
    Route::get("/admin/leads", [LeadController::class, 'index'])->name('admin.leads');
    Route::get("/admin/leads/{id}", [LeadController::class, 'show'])->name('admin.leads.show');
    Route::get("/admin/events", [EventController::class, 'index'])->name('admin.events');
    Route::post('/admin/events', [EventController::class, 'store']);
    Route::get('/admin/events/{id}', [EventController::class, 'show'])->name('admin.events.show');

    Route::get('/admin/programs', [ProgramController::class, 'index'])->name('admin.programs');
    Route::post('/admin/programs', [ProgramController::class, 'store']);
    Route::post('/admin/programs/{id}', [ProgramController::class, 'update']);
    Route::delete('/admin/programs/{id}', [ProgramController::class, 'destroy']);

    Route::get("/admin/booking", [BookingController::class, 'index'])->name('admin.bookings');
    Route::post("/admin/bookings/{id}", [BookingController::class, 'update']);
    Route::post("/api/sync-calendar", [App\Http\Controllers\SyncController::class, 'syncCalendar']);
});

