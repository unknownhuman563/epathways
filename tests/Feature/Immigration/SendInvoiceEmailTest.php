<?php

namespace Tests\Feature\Immigration;

use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SendInvoiceEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_invoice_template_emails_the_client_with_the_pdf_attached(): void
    {
        Mail::fake();

        MessageTemplate::create([
            'key' => 'send_invoice', 'name' => 'Send Invoice',
            'channels' => ['email'], 'is_active' => true,
            'email_subject' => 'Your Invoice Is Ready for Payment',
            'email_body' => 'Kia Ora {{first_name}}, your invoice is ready.',
        ]);

        $lead = Lead::create([
            'first_name' => 'Angi', 'last_name' => 'Libanan', 'email' => 'angi@example.com',
        ]);

        // Mirrors emailInvoice(): template + attached invoice PDF.
        $template = MessageTemplate::where('key', 'send_invoice')->first();
        app(CommunicationService::class)->sendTemplate($template, $lead, [], [
            ['path' => 'inz-generated/1/invoice-x.pdf', 'name' => 'Invoice INV-0001.pdf'],
        ]);

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $m) {
            return $m->hasTo('angi@example.com')
                && collect($m->attachmentFiles)->contains(fn ($a) => $a['name'] === 'Invoice INV-0001.pdf');
        });
    }
}
