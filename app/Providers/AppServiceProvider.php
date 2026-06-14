<?php

namespace App\Providers;

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
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

        // Build the reset URL on the app's own domain (config, not env) so it
        // points at our Inertia reset page rather than a framework default.
        ResetPassword::createUrlUsing(fn ($notifiable, string $token) => rtrim(config('app.url'), '/')
            . '/reset-password/' . $token . '?email=' . urlencode($notifiable->getEmailForPasswordReset()));

        // Professional tone, matching the lead-portal invitation email (D7).
        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $url = rtrim(config('app.url'), '/') . '/reset-password/' . $token
                . '?email=' . urlencode($notifiable->getEmailForPasswordReset());

            return (new MailMessage)
                ->subject('ePathways Account Recovery')
                ->greeting('Hi ' . ($notifiable->name ?? 'there') . ',')
                ->line('We received a request to reset the password for your ePathways account.')
                ->action('Reset your password', $url)
                ->line('This link expires in 60 minutes.')
                ->line('If you didn’t request a password reset, no action is needed — your password will stay the same.');
        });
    }
}
