<?php

use Illuminate\Support\Facades\Route;

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


Route::redirect('/admin', '/admin/dashboard');

Route::get("/admin/dashboard", function (){
   return inertia('Admin/Dashboard'); 
});

