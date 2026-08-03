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

        $this->auditPastPacks();

        return self::SUCCESS;
    }

    /**
     * Retro-check: engagement packs that were generated AFTER the signing
     * adviser's licence had already expired. Before Build 12's generator guard
     * these could be produced silently — written advice under a lapsed licence,
     * on paper in the client's hands. Answers "did any already go out?".
     */
    private function auditPastPacks(): void
    {
        $this->newLine();
        $this->line('Past engagement packs signed under a lapsed licence:');

        $signers = User::query()
            ->whereNotNull('iaa_licence_expiry')
            ->get(['id', 'name', 'iaa_licence_expiry'])
            ->keyBy('id');

        $packs = \App\Models\LeadDocument::query()
            ->where('source_variant', 'like', 'engagement:%')
            ->whereNotNull('engagement_signer_id')
            ->get(['id', 'lead_id', 'original_name', 'engagement_signer_id', 'created_at']);

        $offending = $packs->filter(function ($doc) use ($signers) {
            $signer = $signers->get($doc->engagement_signer_id);

            // Generated strictly after the signer's licence expiry date.
            return $signer && $doc->created_at
                && $doc->created_at->gt($signer->iaa_licence_expiry->copy()->endOfDay());
        });

        if ($offending->isEmpty()) {
            $this->info('None found — no pack was generated after its signer\'s licence expired.');

            return;
        }

        $this->table(
            ['Doc ID', 'Case', 'Document', 'Signer', 'Signer expiry', 'Generated'],
            $offending->map(function ($doc) use ($signers) {
                $signer = $signers->get($doc->engagement_signer_id);

                return [
                    $doc->id,
                    $doc->lead_id,
                    $doc->original_name,
                    $signer?->name ?? '(user removed)',
                    optional($signer?->iaa_licence_expiry)->toDateString() ?? '—',
                    optional($doc->created_at)->toDateTimeString(),
                ];
            }),
        );

        $this->warn($offending->count().' pack(s) were signed under a lapsed licence — review before a client raises it.');
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
