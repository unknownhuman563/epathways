<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use App\Services\EmailAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

/**
 * When a client submits a visa assessment on the public site, the configurable
 * "New enquiry captured" automation (immigration.lead.captured) must fire so an
 * admin can notify staff and/or confirm to the client. The intake funnel has no
 * Lead yet, so the event fires against a transient Lead carrying the applicant's
 * contact details + visa type.
 */
class AssessmentSubmitFiresAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitor_assessment_submit_fires_lead_captured(): void
    {
        $mock = Mockery::mock(EmailAutomationService::class);
        $mock->shouldReceive('fire')
            ->once()
            ->with(
                'immigration.lead.captured',
                Mockery::on(fn ($lead) => $lead instanceof Lead
                    && $lead->first_name === 'Vera'
                    && $lead->last_name === 'Visitor'          // from family_name
                    && $lead->email === 'vera@example.com'
                    && $lead->inz_visa_type === 'Visitor Visa (GVV)'),
                Mockery::on(fn ($ctx) => is_array($ctx)
                    && ($ctx['visa_type'] ?? null) === 'Visitor Visa (GVV)')
            )
            ->andReturn(false);
        $this->app->instance(EmailAutomationService::class, $mock);

        $this->post('/visitor-interest', [
            'family_name' => 'Visitor',
            'first_name' => 'Vera',
            'dob' => '1990-01-01',
            'phone' => '+64 21 555 0000',
            'email' => 'vera@example.com',
            'declaration_accepted' => true,
        ])->assertRedirect();
    }
}
