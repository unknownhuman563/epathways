<?php

namespace Tests\Feature\English;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LearnersPageTest extends TestCase
{
    use RefreshDatabase;

    private function englishUser(): User
    {
        return User::factory()->create(['role' => 'english']);
    }

    private function learner(array $attrs = []): Lead
    {
        return Lead::create(array_merge([
            'first_name'         => 'Test',
            'last_name'          => 'Learner',
            'is_english_student' => true,
        ], $attrs));
    }

    public function test_renders_200_with_paginated_learners(): void
    {
        $this->learner(['first_name' => 'Ann']);
        $this->learner(['first_name' => 'Ben']);

        $this->actingAs($this->englishUser())
            ->get('/portal/english/learners')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portal/english/Learners')
                ->has('learners.data', 2)
                ->has('learners.links')
                ->has('stages')
            );
    }

    public function test_filter_by_stage_returns_only_matching_learners(): void
    {
        $this->learner(['first_name' => 'Pte', 'english_stage' => 'PTE Review']);
        $this->learner(['first_name' => 'Diy', 'english_stage' => 'DIY Review']);

        $this->actingAs($this->englishUser())
            ->get('/portal/english/learners?stage=' . urlencode('PTE Review'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('learners.data', 1)
                ->where('learners.data.0.english_stage', 'PTE Review')
            );
    }

    public function test_search_by_name_finds_expected_learner(): void
    {
        $this->learner(['first_name' => 'Zaraunique', 'last_name' => 'Person']);
        $this->learner(['first_name' => 'Other', 'last_name' => 'Person']);

        $this->actingAs($this->englishUser())
            ->get('/portal/english/learners?search=Zaraunique')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('learners.data', 1)
                ->where('learners.data.0.name', 'Zaraunique Person')
            );
    }

    public function test_non_english_role_gets_403(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);

        $this->actingAs($sales)
            ->get('/portal/english/learners')
            ->assertForbidden();
    }

    public function test_empty_state_when_no_learners(): void
    {
        // A non-english lead must NOT appear.
        Lead::create(['first_name' => 'Not', 'last_name' => 'English', 'is_english_student' => false]);

        $this->actingAs($this->englishUser())
            ->get('/portal/english/learners')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('learners.data', 0));
    }
}
