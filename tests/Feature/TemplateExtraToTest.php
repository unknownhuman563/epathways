<?php

namespace Tests\Feature;

use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TemplateExtraToTest extends TestCase
{
    use RefreshDatabase;

    public function test_extra_to_addresses_are_added_to_the_recipient_line(): void
    {
        Mail::fake();

        $lead = Lead::create([
            'first_name' => 'Client', 'last_name' => 'One',
            'email' => 'client@example.com',
        ]);

        $template = MessageTemplate::create([
            'key' => 'engagement_agreement', 'name' => 'Engagement',
            'channels' => ['email'], 'is_active' => true,
            'email_subject' => 'Please sign', 'email_body' => 'Hello',
            'to_extra' => 'team@epathways.co.nz, records@epathways.co.nz',
        ]);

        app(CommunicationService::class)->sendTemplate($template, $lead);

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $mail) {
            return $mail->hasTo('client@example.com')
                && $mail->hasTo('team@epathways.co.nz')
                && $mail->hasTo('records@epathways.co.nz');
        });
    }
}
