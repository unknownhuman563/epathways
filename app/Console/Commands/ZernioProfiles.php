<?php

namespace App\Console\Commands;

use App\Services\ZernioService;
use Illuminate\Console\Command;

class ZernioProfiles extends Command
{
    protected $signature = 'zernio:profiles';

    protected $description = 'List Zernio profiles so you can set ZERNIO_PROFILE_ID to the one holding your active accounts';

    public function handle(ZernioService $zernio): int
    {
        if (! $zernio->configured()) {
            $this->error('ZERNIO_API_KEY is not set.');

            return self::FAILURE;
        }

        $profiles = $zernio->listProfiles()['profiles'];

        if (empty($profiles)) {
            $this->warn('No profiles returned for this API key.');

            return self::SUCCESS;
        }

        $this->table(['Profile ID', 'Name'], array_map(fn ($p) => [$p['id'], $p['name']], $profiles));
        $this->newLine();
        $this->info('Set ZERNIO_PROFILE_ID in .env to the profile that holds your active accounts');
        $this->info('(the one shown in Zernio when you boost), then run: php artisan config:clear');

        return self::SUCCESS;
    }
}
