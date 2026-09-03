<?php

namespace Tests\Feature\Portal;

use App\Models\Lead;
use App\Models\User;
use App\Services\EmailAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

/**
 * When a client uploads a document from the portal, the "document uploaded"
 * email-automation event must fire so staff can be notified (via the message
 * the admin configures for that key).
 */
class ClientUploadFiresAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_client_checklist_upload_fires_the_document_uploaded_event(): void
    {
        Storage::fake('local');

        $lead = Lead::create(['first_name' => 'Uploady', 'last_name' => 'Client', 'is_immigration_case' => true]);
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        // Expect the automation service to be asked to fire the new event key.
        $mock = Mockery::mock(EmailAutomationService::class);
        $mock->shouldReceive('fire')
            ->once()
            ->with('immigration.document.uploaded', Mockery::type(Lead::class), Mockery::on(
                fn ($ctx) => is_array($ctx) && array_key_exists('document_name', $ctx)
            ))
            ->andReturn(false);
        $this->app->instance(EmailAutomationService::class, $mock);

        $this->actingAs($leadUser)->post('/portal/lead/documents/checklist/passport/upload', [
            'files' => [UploadedFile::fake()->create('passport.pdf', 90, 'application/pdf')],
        ])->assertRedirect();
    }

    public function test_client_request_upload_fires_the_event(): void
    {
        Storage::fake('local');

        $lead = Lead::create(['first_name' => 'Req', 'last_name' => 'Client']);
        $leadUser = User::factory()->create(['role' => 'lead', 'lead_id' => $lead->id]);

        $mock = Mockery::mock(EmailAutomationService::class);
        $mock->shouldReceive('fire')->once()
            ->with('immigration.document.uploaded', Mockery::type(Lead::class), Mockery::type('array'))
            ->andReturn(false);
        $this->app->instance(EmailAutomationService::class, $mock);

        $this->actingAs($leadUser)->post('/portal/lead/documents/upload', [
            'file' => UploadedFile::fake()->create('doc.pdf', 60, 'application/pdf'),
        ])->assertRedirect();
    }
}
