<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\SearchService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Run the global search from the CLI as a given user — handy for
 * smoke-testing role gating and result shaping after changes.
 *
 *   php artisan ep:search "maria"
 *   php artisan ep:search "exalt" --user=sales@epathways.co.nz
 */
class Search extends Command
{
    protected $signature = 'ep:search {query : The search term} {--user= : Email to search as (defaults to a super_admin/admin)}';

    protected $description = 'Run a global search as a user and print grouped results.';

    public function handle(SearchService $service): int
    {
        $query = (string) $this->argument('query');
        if (mb_strlen(trim($query)) < SearchService::MIN_QUERY) {
            $this->error('Query must be at least ' . SearchService::MIN_QUERY . ' characters.');

            return self::FAILURE;
        }

        $email = $this->option('user');
        $user = $email
            ? User::where('email', $email)->first()
            : (User::where('role', 'super_admin')->first()
                ?? User::where('role', 'admin')->first()
                ?? User::first());

        if (! $user) {
            $this->error($email ? "No user with email {$email}." : 'No users found to search as.');

            return self::FAILURE;
        }

        $groups = $service->search($query, $user);

        if (empty($groups)) {
            $this->info("No results for \"{$query}\" (as {$user->email}).");

            return self::SUCCESS;
        }

        $rows = [];
        foreach ($groups as $g) {
            foreach ($g['items'] as $it) {
                $rows[] = [
                    $g['type'],
                    Str::limit($it['label'] ?? '', 30),
                    Str::limit($it['sublabel'] ?? '', 30),
                    $it['url'] ?? '',
                ];
            }
        }

        $this->info("Search \"{$query}\" as {$user->email} ({$user->role}):");
        $this->table(['TYPE', 'LABEL', 'SUBLABEL', 'URL'], $rows);

        return self::SUCCESS;
    }
}
