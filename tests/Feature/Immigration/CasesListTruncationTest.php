<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Regression: the immigration Cases list used to `->limit(200)` ordered by most
 * recent activity, silently dropping the least-recently-active cases. "For
 * Assessment" cases sit untouched at the start of the pipeline, so they were
 * exactly the ones that fell off the bottom once the queue passed 200 — and
 * client-side search couldn't reach them. The list must load the whole queue
 * (up to a high safety ceiling) and report an honest total.
 */
class CasesListTruncationTest extends TestCase
{
    use RefreshDatabase;

    private function makeCase(array $attrs): Lead
    {
        return Lead::create(array_merge([
            'is_immigration_case' => true,
            'email' => fake()->unique()->safeEmail(),
        ], $attrs));
    }

    public function test_cases_beyond_the_old_200_window_are_still_loaded_and_findable(): void
    {
        // 205 recently-active cases…
        for ($i = 0; $i < 205; $i++) {
            $this->makeCase([
                'first_name' => 'Active', 'last_name' => "Case{$i}",
                'immigration_stage' => 'Endorsed',
            ]);
        }

        // …plus one "For Assessment" case that's been untouched the longest, so
        // under the old DESC + limit(200) it was row 206 and vanished.
        $stale = $this->makeCase([
            'first_name' => 'Aroha', 'last_name' => 'Ngata',
            'immigration_stage' => 'For Assessment',
        ]);
        $stale->forceFill([
            'last_activity_at' => now()->subYears(2),
            'updated_at' => now()->subYears(2),
        ])->saveQuietly();

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->get('/portal/immigration/cases')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                // All 206 present — the old limit(200) would have returned 200.
                ->has('cases', 206)
                ->where('total', 206)
                ->where('loaded', 206)
            );

        // The stale For-Assessment case is specifically among them.
        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->get('/portal/immigration/cases')
            ->assertInertia(fn (Assert $p) => $p
                ->where('cases', fn ($cases) => collect($cases)->contains('id', $stale->id))
            );
    }

    public function test_distribution_counts_cover_the_whole_queue_not_a_slice(): void
    {
        // One For-Assessment among enough Endorsed cases that the old cap would
        // have excluded it from the distribution counts too.
        for ($i = 0; $i < 201; $i++) {
            $this->makeCase(['first_name' => 'E', 'last_name' => "C{$i}", 'immigration_stage' => 'Endorsed']);
        }
        $stale = $this->makeCase(['first_name' => 'For', 'last_name' => 'Assess', 'immigration_stage' => 'For Assessment']);
        $stale->forceFill(['updated_at' => now()->subYears(2)])->saveQuietly();

        $this->actingAs(User::factory()->create(['role' => 'immigration']))
            ->get('/portal/immigration/cases')
            ->assertInertia(fn (Assert $p) => $p
                ->where('distribution', fn ($dist) => collect($dist)
                    ->firstWhere('stage', 'For Assessment')['count'] === 1)
            );
    }
}
