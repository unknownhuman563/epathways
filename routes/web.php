<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;

Route::get('/', function () {
    return inertia('home');
});

Route::get("/booking", function (){
   return inertia('bookingpage'); 
});


Route::get("/education-journey", function (){
   return inertia('EducationJourney'); 
});

Route::get("/programs-levels", function (){
   return inertia('ProgramsLevels'); 
});

Route::get("/program-details", function (){
   return inertia('ProgramDetails'); 
});

Route::get("/fee-guide", function (){
   return inertia('FeeGuide'); 
});

Route::get("/about-us", function (){
   return inertia('AboutUs'); 
});

Route::redirect('/education journey', '/education-journey');

// Public Registration Routes
Route::get('/register/{event_code}', [EventController::class, 'showRegistrationForm']);
Route::post('/register/{event_code}', [EventController::class, 'registerLead']);

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
    Route::get("/admin/leads", function (){
       return inertia('Admin/Leads'); 
    });
    Route::get("/admin/leads/{id}", function ($id){
       return inertia('Admin/LeadDetails', ['leadId' => $id]); 
    });
    Route::get("/admin/events", [EventController::class, 'index'])->name('admin.events');
    Route::post('/admin/events', [EventController::class, 'store']);
});

