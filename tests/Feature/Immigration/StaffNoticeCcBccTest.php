<?php

namespace Tests\Feature\Immigration;

use App\Mail\TemplatedMessage;
use App\Models\EmailAutomationMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\EmailAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * A staff-recipient automation notice must honour the template's own recipient
 * fields — "To — also send to", Cc and Bcc — not just the resolved role
 * address. The role picks the base recipient; the template adds the rest.
 */
class StaffNoticeCcBccTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_notice_copies_template_to_extra_cc_and_bcc(): void
    {
        Mail::fake();

        $adviser = User::factory()->create(['name' => 'Ada Adviser', 'email' => 'ada@example.com', 'role' => 'immigration_adviser']);
        $lead = Lead::create([
            'first_name' => 'Case', 'last_name' => 'X', 'email' => 'client@example.com',
            'is_immigration_case' => true, 'immigration_assignee' => 'Ada Adviser',
        ]);

        MessageTemplate::create([
            'key' => 'test_staff_notice',
            'department' => 'immigration',
            'name' => 'Staff notice',
            'channels' => ['email'],
            'email_subject' => 'Notice {{first_name}}',
            'email_body' => 'A new case needs attention.',
            'to_extra' => 'hendry@example.com',
            'cc' => 'eireen@example.com, dev@example.com',
            'bcc' => 'records@example.com',
            'is_active' => true,
        ]);

        EmailAutomationMessage::create([
            'event_key' => 'immigration.lead.captured',
            'recipient' => 'adviser',
            'template_key' => 'test_staff_notice',
            'channel' => 'email',
            'enabled' => true,
            'sort_order' => 0,
        ]);

        app(EmailAutomationService::class)->fire('immigration.lead.captured', $lead, ['visa_type' => 'Work']);

        Mail::assertQueued(TemplatedMessage::class, function (TemplatedMessage $mail) {
            return $mail->hasTo('ada@example.com')          // resolved role
                && $mail->hasTo('hendry@example.com')       // template To-also
                && str_contains((string) $mail->ccList, 'eireen@example.com')
                && str_contains((string) $mail->ccList, 'dev@example.com')  // BOTH cc addresses
                && str_contains((string) $mail->bccList, 'records@example.com');
        });
    }
}
