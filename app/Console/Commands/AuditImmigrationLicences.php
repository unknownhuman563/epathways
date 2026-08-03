<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Read-only audit of IAA licence data for everyone who will need the Build 12
 * §2 advice gate. Run this on production BEFORE relying on the gate: a null or
 * past expiry on a currently-practising adviser means the gate is closed for
 * them on day one, and they will not be able to record a verdict.
 *
 * Nothing is modified.
 */
class AuditImmigrationLicences extends Command
{
    protected $signature = 'immigration:licence-audit';

    protected $description = 'Report IAA licence status for every immigration-role user (read-only)';

    public function handle(): int
    {
        $users = User::query()
            ->whereIn('role', array_merge(['immigration'], User::IMMIGRATION_ROLES))
            ->orderBy('name')
            ->get();

        if ($users->isEmpty()) {
            $this->warn('No immigration-role users found.');

            return self::SUCCESS;
        }

        $rows = $users->map(function (User $u) {
            $gate = $u->holdsCurrentLicence();

            return [
                $u->name,
                $u->role,
                $u->iaa_licence_number ?: '—',
                optional($u->iaa_licence_expiry)->toDateString() ?? '—',
                $gate ? 'OPEN' : 'CLOSED',
                $this->reason($u),
            ];
        });

        $this->table(
            ['Name', 'Role', 'Licence #', 'Expiry', 'Gate', 'Note'],
            $rows,
        );

        $blocked = $users->reject->holdsCurrentLicence();
        $this->newLine();
        $this->info("{$users->count()} immigration user(s); ".$blocked->count().' with the advice gate CLOSED.');

        if ($blocked->isNotEmpty()) {
            $this->warn('Users with a closed gate cannot record verdicts/endorsements/RFI responses until their licence data is corrected.');
        }

        return self::SUCCESS;
    }

    private function reason(User $u): string
    {
        if (blank($u->iaa_licence_number)) {
            return 'no licence number on file';
        }
        if ($u->iaa_licence_expiry === null) {
            return 'expiry missing';
        }
        if ($u->iaa_licence_expiry->isPast()) {
            return 'licence expired';
        }

        return 'current';
    }
}
