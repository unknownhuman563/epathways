<?php

namespace Tests\Feature\Immigration;

use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EngagementTemplateLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_migration_agreement_button_uses_the_engagement_link(): void
    {
        Mail::fake();

        // The template is seeded by the populate migration.
        $tpl = MessageTemplate::where('key', 'migration_agreement')->first();
        $this->assertNotNull($tpl, 'migration_agreement template should be seeded by the migration');

        $lead = Lead::create([
            'first_name' => 'Mary', 'last_name' => 'Paspe', 'email' => 'paspe0110@example.com',
        ]);

        $link = 'https://epathways.co.nz/engagement/nYS3upzIyqUzfOSdQYq5Fojswb6gnqOa';
        app(CommunicationService::class)->sendTemplate($tpl, $lead, ['engagement_url' => $link]);

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $m) use ($link) {
            return str_contains($m->markdownBody, $link)          // link is in the button
                && ! str_contains($m->markdownBody, '{{engagement_url}}') // placeholder replaced
                && str_contains($m->markdownBody, 'Mary');        // {{first_name}} filled
        });
    }
}
