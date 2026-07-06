<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;

/**
 * Runs the IMAP reply sync off the web request. ShouldBeUnique means clicking
 * "Sync now" repeatedly (or a scheduled run overlapping) never stacks up — only
 * one sync is queued/running at a time.
 */
class SyncEmailRepliesJob implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** IMAP fetches can be slow; give it room before the worker kills it. */
    public int $timeout = 180;

    /** Only one queued/running at a time within this window (seconds). */
    public int $uniqueFor = 600;

    public function uniqueId(): string
    {
        return 'sync-email-replies';
    }

    public function handle(): void
    {
        Artisan::call('email:sync-replies');
    }
}
