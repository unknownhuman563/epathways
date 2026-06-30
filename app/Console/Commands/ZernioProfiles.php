<?php

namespace App\Console\Commands;

use App\Services\ZernioService;
use Illuminate\Console\Command;

class ZernioProfiles extends Command
{
    protected $signature = 'zernio:profiles';

    protected $description = 'List Zernio profiles and the accounts inside each, so you can set ZERNIO_PROFILE_ID';

    public function handle(ZernioService $zernio): int
    {
        if (! $zernio->configured()) {
            $this->error('ZERNIO_API_KEY is not set.');

            return self::FAILURE;
        }

        $configured = config('services.zernio.profile_id');
        $this->line('Configured ZERNIO_PROFILE_ID: '.($configured ?: '(none — currently NOT scoped)'));
        $this->newLine();

        $profiles = $zernio->listProfiles()['profiles'];

        if (empty($profiles)) {
            $this->warn('No profiles returned for this API key.');

            return self::SUCCESS;
        }

        foreach ($profiles as $p) {
            $active = $configured && $configured === $p['id'] ? '  <-- ACTIVE' : '';
            $this->info("PROFILE  {$p['name']}   id={$p['id']}{$active}");

            try {
                $accounts = $zernio->accountsForProfile($p['id']);
                if (empty($accounts)) {
                    $this->line('    (no accounts)');
                }
                foreach ($accounts as $a) {
                    $this->line("    - {$a['platform']}  {$a['handle']}   ({$a['id']})");
                }
            } catch (\Throwable $e) {
                $this->line('    (could not list accounts: '.$e->getMessage().')');
            }
            $this->newLine();
        }

        $this->info('Set ZERNIO_PROFILE_ID to the profile that holds your Klyvera accounts, then run: php artisan config:clear');

        return self::SUCCESS;
    }
}
