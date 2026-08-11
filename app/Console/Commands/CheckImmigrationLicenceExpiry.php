<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\ImmigrationLicenceExpiring;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

/**
 * Build 12 §2 safety net. Warns a licensed adviser (and the admins) when their
 * IAA licence is approaching expiry, so the AdviceBearingPolicy gate never
 * closes by surprise.
 *
 * Fires when the days-remaining lands exactly on a configured threshold (see
 * config/immigration.php) or on the day the licence lapses. Exact-day matching
 * means running this once daily sends each warning once, with no dedup state to
 * maintain. If the scheduler misses a day the dashboard IaaComplianceCard is
 * the always-on backstop.
 */
class CheckImmigrationLicenceExpiry extends Command
{
    protected $signature = 'immigration:licence-expiry-check';

    protected $description = 'Notify advisers + admins when an IAA licence is nearing expiry (Build 12 §2)';

    public function handle(): int
    {
        $thresholds = (array) config('immigration.licence_warning_days', [30, 14]);

        $licensed = User::query()
            ->whereNotNull('iaa_licence_number')
            ->where('iaa_licence_number', '!=', '')
            ->whereNotNull('iaa_licence_expiry')
            ->get();

        $admins = User::query()
            ->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN])
            ->get();

        $sent = 0;

        foreach ($licensed as $adviser) {
            // false → signed diff: positive before expiry, 0 on the day, negative after.
            $days = (int) now()->startOfDay()->diffInDays($adviser->iaa_licence_expiry->copy()->startOfDay(), false);

            if (! in_array($days, $thresholds, true) && $days !== 0) {
                continue;
            }

            $notification = new ImmigrationLicenceExpiring($adviser, $days);

            // The adviser themselves…
            Notification::send($adviser, $notification);
            // …and the admins, deduped so an admin who also holds the licence
            // is not notified twice.
            Notification::send($admins->reject(fn (User $a) => $a->is($adviser)), $notification);

            $sent++;
            $this->line("Warned {$adviser->name} ({$days} day(s) to expiry).");
        }

        $this->info("Licence expiry check complete — {$sent} adviser(s) warned.");

        return self::SUCCESS;
    }
}
