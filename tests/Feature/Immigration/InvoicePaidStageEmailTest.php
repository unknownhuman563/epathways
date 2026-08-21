<?php

namespace Tests\Feature\Immigration;

use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvoicePaidStageEmailTest extends TestCase
{
    use RefreshDatabase;

    private function invoiceTemplate(): void
    {
        MessageTemplate::create([
            'key' => 'invoice_paid', 'name' => 'Invoice Paid',
            'channels' => ['email'], 'is_active' => true,
            'email_subject' => 'Payment received', 'email_body' => 'Thank you',
        ]);
    }

    private function case(string $stage = 'For Agreement & Invoice'): Lead
    {
        return Lead::create([
            'first_name' => 'Case', 'last_name' => 'Client',
            'email' => 'case@example.com',
            'is_immigration_case' => true,
            'immigration_stage' => $stage,
        ]);
    }

    public function test_moving_a_case_to_invoice_paid_sends_the_invoice_paid_email(): void
    {
        Mail::fake();
        $this->invoiceTemplate();
        $lead = $this->case();

        $lead->update(['immigration_stage' => 'Invoice Paid']);

        Mail::assertQueued(TemplatedMessage::class, fn (TemplatedMessage $m) => $m->hasTo('case@example.com'));
    }

    public function test_moving_to_an_unmapped_stage_sends_nothing(): void
    {
        Mail::fake();
        $this->invoiceTemplate();
        $lead = $this->case();

        $lead->update(['immigration_stage' => 'Endorsed']);

        Mail::assertNothingQueued();
    }

    public function test_re_saving_at_invoice_paid_does_not_resend(): void
    {
        Mail::fake();
        $this->invoiceTemplate();
        $lead = $this->case('Invoice Paid');   // already there (set on create)

        // A save that doesn't change the stage must not fire the email.
        $lead->update(['immigration_priority' => 'High']);

        Mail::assertNothingQueued();
    }
}
