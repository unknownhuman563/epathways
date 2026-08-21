<?php

namespace Tests\Feature\Immigration;

use App\Jobs\SendLeadFollowupEmail;
use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AgreementSignedEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_agreement_signed_key_resolves_and_emails_the_client(): void
    {
        Mail::fake();

        MessageTemplate::create([
            'key' => 'agreement_signed', 'name' => '07 - Agreement Signed (CLIENT)',
            'channels' => ['email'], 'is_active' => true,
            'email_subject' => 'Engagement Agreement Received',
            'email_body' => 'Kia Ora {{first_name}}, we received your signed agreement.',
        ]);

        $lead = Lead::create([
            'first_name' => 'Angi', 'last_name' => 'Libanan', 'email' => 'angi@example.com',
        ]);

        // This is exactly the call the sign() endpoint makes after signing.
        SendLeadFollowupEmail::sendKey('agreement_signed', $lead);

        Mail::assertQueued(TemplatedMessage::class, fn (TemplatedMessage $m) => $m->hasTo('angi@example.com'));
    }
}
