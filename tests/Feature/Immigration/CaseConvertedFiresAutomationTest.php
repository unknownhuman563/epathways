<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Models\User;
use App\Services\EmailAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * Converting a lead to an immigration case fires the configurable
 * "Converted to case" automation (immigration.case.converted) so an admin can
 * welcome the client and/or notify the case team. Re-converting must not re-fire.
 */
class CaseConvertedFiresAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_convert_to_case_fires_case_converted_event(): void
    {
        $lead = Lead::create(['first_name' => 'Conv', 'last_name' => 'Case', 'email' => 'conv@example.com']);

        $mock = Mockery::mock(EmailAutomationService::class);
        $mock->shouldReceive('fire')
            ->once()
            ->with(
                'immigration.case.converted',
                Mockery::on(fn ($l) => $l instanceof Lead && $l->id === $lead->id),
                Mockery::type('array')
            )
            ->andReturn(false);
        $this->app->instance(EmailAutomationService::class, $mock);

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post("/admin/leads/{$lead->id}/convert-to-case")
            ->assertRedirect();
    }

    public function test_already_a_case_does_not_fire(): void
    {
        $lead = Lead::create(['first_name' => 'Done', 'last_name' => 'Already', 'is_immigration_case' => true]);

        $mock = Mockery::mock(EmailAutomationService::class);
        $mock->shouldNotReceive('fire');
        $this->app->instance(EmailAutomationService::class, $mock);

        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post("/admin/leads/{$lead->id}/convert-to-case"); // returns "already a case"
    }
}
