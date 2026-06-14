<?php

namespace Tests\Feature\Search;

use App\Models\Lead;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_runs_successfully_with_valid_query(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'email' => 'admin@test.co']);
        Lead::create(['first_name' => 'Mariana', 'last_name' => 'Cruz']);

        $this->artisan('ep:search', ['query' => 'Mariana', '--user' => 'admin@test.co'])
            ->expectsOutputToContain('Mariana')
            ->assertExitCode(0);
    }

    public function test_command_respects_user_option(): void
    {
        User::factory()->create(['role' => 'sales', 'email' => 'sales@test.co']);
        User::factory()->create(['role' => 'accommodation', 'email' => 'acc@test.co']);
        Property::create(['name' => 'Searchable Villa', 'location' => 'AKL', 'room_type' => 'single', 'rent_single' => 200, 'status' => 'available']);

        // Sales can't see properties → no results.
        $this->artisan('ep:search', ['query' => 'Searchable', '--user' => 'sales@test.co'])
            ->expectsOutputToContain('No results')
            ->assertExitCode(0);

        // Accommodation can.
        $this->artisan('ep:search', ['query' => 'Searchable', '--user' => 'acc@test.co'])
            ->expectsOutputToContain('Searchable Villa')
            ->assertExitCode(0);
    }

    public function test_empty_results_show_no_results_message(): void
    {
        User::factory()->create(['role' => 'admin', 'email' => 'admin@test.co']);

        $this->artisan('ep:search', ['query' => 'zzzznomatch', '--user' => 'admin@test.co'])
            ->expectsOutputToContain('No results')
            ->assertExitCode(0);
    }

    public function test_query_under_two_chars_shows_validation_error(): void
    {
        User::factory()->create(['role' => 'admin', 'email' => 'admin@test.co']);

        $this->artisan('ep:search', ['query' => 'a', '--user' => 'admin@test.co'])
            ->expectsOutputToContain('at least 2 characters')
            ->assertExitCode(1);
    }

    public function test_unknown_user_fails(): void
    {
        $this->artisan('ep:search', ['query' => 'maria', '--user' => 'nobody@test.co'])
            ->expectsOutputToContain('No user with email')
            ->assertExitCode(1);
    }
}
