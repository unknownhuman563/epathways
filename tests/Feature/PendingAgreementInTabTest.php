<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use App\Services\ConsultancyReviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PendingAgreementInTabTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_consultancy_agreement_shows_on_agreements_tab(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $lead = Lead::create(['first_name' => 'Emma', 'last_name' => 'T', 'email' => 'e@x.com']);
        ConsultancyReviewService::submit($lead, 'consultancy_std_100', ['school_enrolment_fee' => 100000], $admin->id);

        $this->actingAs($admin)
            ->get('/admin/leads/proposals-agreements')
            ->assertOk()
            ->assertInertia(fn (Assert $p) => $p
                ->has('agreements', 1)
                ->where('agreements.0.name', 'Emma T')
                ->where('agreements.0.documents.0.pending_verification', true)
                ->where('agreements.0.documents.0.verification_status', 'pending')
                ->etc()
            );
    }
}
