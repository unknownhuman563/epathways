<?php

use App\Services\NewsFeedService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Warm the NZ migration news cache hourly so visitors never trigger the
// HTTP fetch on the critical render path. Cache key + TTL are managed by
// the service itself.
Schedule::call(fn () => (new NewsFeedService)->refresh())
    ->hourly()
    ->name('news-feed-refresh')
    ->withoutOverlapping();

// Fire any bulk-email campaign whose scheduled time has arrived.
Schedule::command('campaigns:dispatch-due')
    ->everyMinute()
    ->name('dispatch-due-campaigns')
    ->withoutOverlapping();

// Fire any scheduled event email whose time has arrived.
Schedule::command('events:dispatch-due-emails')
    ->everyMinute()
    ->name('dispatch-due-event-emails')
    ->withoutOverlapping();

// Pull inbound email replies from the monitored mailbox into the system.
Schedule::command('email:sync-replies')
    ->everyFiveMinutes()
    ->name('sync-email-replies')
    ->withoutOverlapping();

// Warn advisers + admins before an IAA licence lapses (Build 12 §2). Daily,
// mid-morning NZ time so the email lands during the working day; exact-day
// threshold matching means once-daily sends each warning once.
Schedule::command('immigration:licence-expiry-check')
    ->dailyAt('09:00')
    ->timezone('Pacific/Auckland')
    ->name('immigration-licence-expiry-check')
    ->withoutOverlapping();

// Nightly case-findings sweep (Build 12 phase 3) so time-based rules (idle
// cases, unanswered document requests, passport expiry) refresh even on
// untouched cases. Runs before the working day; per-case work is queued.
Schedule::command('immigration:evaluate-findings')
    ->dailyAt('04:30')
    ->timezone('Pacific/Auckland')
    ->name('immigration-evaluate-findings')
    ->withoutOverlapping();
