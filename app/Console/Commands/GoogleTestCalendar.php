<?php

namespace App\Console\Commands;

use Google\Client as GoogleClient;
use Google\Service\Calendar;
use Google\Service\Calendar\Event;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Calendar\FreeBusyRequest;
use Google\Service\Calendar\FreeBusyRequestItem;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Diagnostic: can the booking service account actually act on a given
 * Workspace user's Google Calendar? Impersonates the target account (domain-wide
 * delegation), reads its free/busy, and — with --write — creates then deletes a
 * throwaway event. Tells you WORKING vs BLOCKED before you point real bookings
 * at a calendar. Kept out of the app flow; run by hand.
 *
 *   php artisan google:test-calendar                       # tests emma@epathways.co.nz (read only)
 *   php artisan google:test-calendar you@epathways.co.nz   # tests a different account
 *   php artisan google:test-calendar --write               # also create+delete a test event
 */
class GoogleTestCalendar extends Command
{
    protected $signature = 'google:test-calendar {email? : Workspace account to impersonate (default emma@epathways.co.nz)} {--write : Also create then delete a throwaway event to prove write access}';

    protected $description = 'Check whether the booking service account can read/write a Workspace user\'s Google Calendar (domain-wide delegation test).';

    public function handle(): int
    {
        $email = $this->argument('email') ?: 'emma@epathways.co.nz';
        $calendarId = (string) config('services.google_calendar.calendar_id', 'primary');

        $this->line('');
        $this->info('Google Calendar delegation test');
        $this->line('  Impersonating : '.$email);
        $this->line('  Calendar id   : '.$calendarId.($calendarId === 'primary' ? "  (the impersonated user's own calendar)" : ''));
        $this->line('');

        // --- Preconditions ---------------------------------------------------
        $keyFile = $this->keyFilePath();
        if ($keyFile === null || ! is_file($keyFile)) {
            $this->error('BLOCKED — service-account key file not found.');
            $this->line('  Set GOOGLE_DRIVE_KEY_FILE to the service-account JSON path (config services.google_calendar.key_file).');
            $this->line('  Current value: '.(config('services.google_calendar.key_file') ?: '(empty)'));

            return self::FAILURE;
        }
        $this->line('  Key file      : '.$keyFile.'  ✓');

        try {
            $client = new GoogleClient;
            $client->setAuthConfig($keyFile);
            $client->setScopes([Calendar::CALENDAR]);
            $client->setSubject($email); // <-- domain-wide delegation impersonation
            $calendar = new Calendar($client);
        } catch (\Throwable $e) {
            $this->error('BLOCKED — could not build the Google client: '.$e->getMessage());

            return self::FAILURE;
        }

        // --- 1) READ: free/busy for the next 7 days --------------------------
        $this->line('');
        $this->line('1) Reading free/busy (next 7 days)…');
        try {
            $from = Carbon::now();
            $to = Carbon::now()->addDays(7);

            $req = new FreeBusyRequest([
                'timeMin' => $from->toRfc3339String(),
                'timeMax' => $to->toRfc3339String(),
                'items' => [new FreeBusyRequestItem(['id' => $calendarId])],
            ]);
            $result = $calendar->freebusy->query($req);

            $cals = $result->getCalendars();
            $busyCount = 0;
            foreach ($cals as $c) {
                $busyCount += count($c->getBusy() ?? []);
            }
            $this->info('   ✓ READ OK — delegation works. Found '.$busyCount.' busy block(s) in the next 7 days.');
        } catch (\Throwable $e) {
            return $this->explainFailure($e, $email);
        }

        // --- 2) WRITE (optional): create then delete a throwaway event -------
        if ($this->option('write')) {
            $this->line('');
            $this->line('2) Creating a throwaway test event tomorrow, then deleting it…');
            try {
                $start = Carbon::tomorrow()->setTime(9, 0);
                $end = (clone $start)->addMinutes(30);

                $event = new Event([
                    'summary' => '[ePathways] delegation test — safe to ignore',
                    'description' => 'Created by php artisan google:test-calendar to verify write access. Auto-deleted.',
                    'start' => new EventDateTime(['dateTime' => $start->toRfc3339String(), 'timeZone' => 'Pacific/Auckland']),
                    'end' => new EventDateTime(['dateTime' => $end->toRfc3339String(), 'timeZone' => 'Pacific/Auckland']),
                ]);

                $created = $calendar->events->insert($calendarId, $event);
                $this->info('   ✓ WRITE OK — event created (id '.$created->getId().').');

                $calendar->events->delete($calendarId, $created->getId());
                $this->info('   ✓ CLEANUP OK — test event deleted.');
            } catch (\Throwable $e) {
                return $this->explainFailure($e, $email);
            }
        } else {
            $this->line('');
            $this->line('   (Skipped the write test. Re-run with --write to also prove event creation.)');
        }

        $this->line('');
        $this->info('RESULT: WORKING — the service account can act on '.$email."'s calendar.");
        $this->line('  To route bookings here, set on prod .env:');
        $this->line('    GOOGLE_CALENDAR_IMPERSONATE='.$email);
        $this->line('    GOOGLE_CALENDAR_ID=primary');
        $this->line('  then: php artisan config:cache');
        $this->line('');

        return self::SUCCESS;
    }

    /** Turn a Google API exception into a plain-language verdict. */
    private function explainFailure(\Throwable $e, string $email): int
    {
        $msg = $e->getMessage();
        $this->line('');

        if (str_contains($msg, 'unauthorized_client') || str_contains($msg, 'Client is unauthorized')) {
            $this->error('RESULT: BLOCKED — domain-wide delegation is NOT authorized for this account.');
            $this->line('  The service account is not allowed to impersonate '.$email.'.');
            $this->line('  Fix in the Google Workspace that owns '.explode('@', $email)[1].':');
            $this->line('    Admin console → Security → API controls → Domain-wide delegation');
            $this->line('    Add this service account\'s Client ID with scope:');
            $this->line('      https://www.googleapis.com/auth/calendar');
        } elseif (str_contains($msg, 'Not Found') || str_contains($msg, '404') || str_contains($msg, 'notFound')) {
            $this->error('RESULT: BLOCKED — account or calendar not found.');
            $this->line('  '.$email.' may not be a real user in the Workspace (an alias/forwarder won\'t work),');
            $this->line('  or the calendar id "'.config('services.google_calendar.calendar_id', 'primary').'" is not accessible to it.');
        } elseif (str_contains($msg, '403') || str_contains($msg, 'forbidden') || str_contains($msg, 'insufficient')) {
            $this->error('RESULT: BLOCKED — access forbidden (403).');
            $this->line('  Delegation may be authorized but missing the calendar scope, or the account lacks calendar access.');
        } else {
            $this->error('RESULT: BLOCKED — '.$msg);
        }

        $this->line('');

        return self::FAILURE;
    }

    private function keyFilePath(): ?string
    {
        $path = config('services.google_calendar.key_file');
        if (blank($path)) {
            return null;
        }

        return str_starts_with($path, '/') || preg_match('/^[A-Za-z]:\\\\/', $path)
            ? $path
            : base_path($path);
    }
}
