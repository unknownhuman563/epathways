<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Already-logged-in users hitting a 'guest' route (e.g. /login) land on
        // their own home — admins on /admin/dashboard, portal staff on their portal.
        RedirectIfAuthenticated::redirectUsing(
            fn ($request) => $request->user()?->homeRoute() ?? '/'
        );
    }
}
