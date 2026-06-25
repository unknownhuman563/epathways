<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Ops pre-flight: confirm the mail config will actually deliver mail.
 *
 * The framework default (and .env.example) ship MAIL_MAILER=log, which
 * silently writes "sent" mail to the log instead of delivering it. The
 * only transactional email today — the lead-portal invitation
 * (App\Mail\LeadPortalInvitation, sent from LeadPortalInvitationController)
 * — therefore never reaches the lead unless production overrides the
 * mailer. This command surfaces that before it bites.
 *
 * Usage:
 *   php artisan ep:check-mail
 *
 * Exit code is non-zero when the active mailer cannot deliver (log/array),
 * so it can gate a deploy step.
 */
class CheckMailConfig extends Command
{
    protected $signature = 'ep:check-mail';

    protected $description = 'Verify the mail driver is configured to actually deliver mail (warns loudly if set to log/array).';

    /** Mailers that accept mail but never deliver it. */
    private const NON_DELIVERING = ['log', 'array'];

    private const PLACEHOLDER_FROM = 'hello@example.com';

    public function handle(): int
    {
        $mailer      = (string) config('mail.default');
        $fromAddress = (string) config('mail.from.address');
        $fromName    = (string) config('mail.from.name');

        $this->line('');
        $this->line('  Mail configuration');
        $this->line('  ------------------');
        $this->line("  Default mailer : <options=bold>{$mailer}</>");
        $this->line("  From address   : {$fromAddress}");
        $this->line("  From name      : {$fromName}");
        $this->line('');

        $ok = true;

        if (in_array($mailer, self::NON_DELIVERING, true)) {
            $ok = false;
            $this->error('  ✖ MAIL WILL NOT BE DELIVERED');
            $this->warn("    The active mailer is '{$mailer}', which only records mail (it does");
            $this->warn('    not send it). Transactional email — e.g. the lead-portal invitation');
            $this->warn('    — will silently fail to reach recipients.');
            $this->warn('    Set MAIL_MAILER=smtp (or ses/postmark/resend) in the production .env');
            $this->warn('    and run `php artisan config:clear`. See docs/production-config.md.');
        } else {
            $this->info("  ✓ Active mailer '{$mailer}' is a delivering transport.");
        }

        if ($fromAddress === self::PLACEHOLDER_FROM || $fromAddress === '') {
            $ok = false;
            $this->warn("  ⚠ From address is the framework placeholder ('{$fromAddress}').");
            $this->warn('    Set MAIL_FROM_ADDRESS to a real ePathways address.');
        }

        if ($mailer === 'smtp') {
            $host = (string) config('mail.mailers.smtp.host');
            $user = config('mail.mailers.smtp.username');
            if ($host === '' || $host === '127.0.0.1' || $host === 'localhost') {
                $this->warn("  ⚠ SMTP host is '{$host}', which looks like a local/default value.");
            }
            if (empty($user)) {
                $this->warn('  ⚠ SMTP username is empty — most providers require authentication.');
            }
        }

        $this->line('');

        if ($ok) {
            $this->info('Mail config looks deliverable.');
            return self::SUCCESS;
        }

        $this->error('Mail config needs attention (see above).');
        return self::FAILURE;
    }
}
