<?php

namespace Tests\Feature;

use App\Models\EmailAutomationMessage;
use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\EmailAutomationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * A "team" recipient on a non-immigration event resolves to that department's
 * staff (role == department) plus the lead's assigned staff member.
 */
class EducationTeamNoticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_education_team_notice_emails_education_staff(): void
    {
        Mail::fake();

        $edu1 = User::factory()->create(['role' => 'education', 'email' => 'edu1@ep.com']);
        $edu2 = User::factory()->create(['role' => 'education', 'email' => 'edu2@ep.com']);
        User::factory()->create(['role' => 'immigration_manager', 'email' => 'immi@ep.com']);

        $lead = Lead::create(['first_name' => 'C', 'last_name' => 'One', 'email' => 'client@example.com']);

        MessageTemplate::create([
            'key' => 'edu_team_notice', 'department' => 'education', 'name' => 'Team notice',
            'channels' => ['email'], 'email_subject' => 'Proposal in', 'email_body' => 'A proposal was submitted.',
            'is_active' => true,
        ]);

        EmailAutomationMessage::create([
            'event_key' => 'education.proposal.submitted', 'recipient' => 'team',
            'template_key' => 'edu_team_notice', 'channel' => 'email', 'enabled' => true, 'sort_order' => 0,
        ]);

        app(EmailAutomationService::class)->fire('education.proposal.submitted', $lead, []);

        Mail::assertQueued(\App\Mail\TemplatedMessage::class, function ($mail) {
            return $mail->hasTo('edu1@ep.com') && $mail->hasTo('edu2@ep.com') && ! $mail->hasTo('immi@ep.com');
        });
    }
}
