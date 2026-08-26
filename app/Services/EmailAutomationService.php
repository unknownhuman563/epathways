<?php

namespace App\Services;

use App\Models\EmailAutomationMessage;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\MessageTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Fires configured email-automation messages for an event. Safe by design:
 * every message defaults to OFF, so nothing sends until an admin turns it on;
 * a fire() with no enabled messages is a no-op, and any failure is logged, not
 * thrown, so it can never break the action that triggered it.
 *
 * Client messages go through CommunicationService (the same door the rest of
 * the app uses); staff messages render the same template and email the resolved
 * staff member (adviser / manager / team) for the case.
 */
class EmailAutomationService
{
    public function __construct(
        private CommunicationService $comms,
        private EmailEventRegistry $registry,
    ) {}

    /**
     * Fire an automation event for a case/lead. Extra context is merged into
     * the template variables (fees, dates, names — never generated, always
     * passed from the calling action).
     */
    public function fire(string $eventKey, Lead $lead, array $context = []): void
    {
        try {
            $messages = EmailAutomationMessage::where('event_key', $eventKey)
                ->where('enabled', true)
                ->orderBy('sort_order')
                ->get();

            if ($messages->isEmpty()) {
                return; // nothing configured — no-op
            }

            $department = $this->registry->departmentOf($eventKey);

            foreach ($messages as $msg) {
                if (empty($msg->template_key)) {
                    continue;
                }
                $this->deliver($msg, $lead, $context, $department);
            }
        } catch (\Throwable $e) {
            Log::warning('Email automation fire failed', ['event' => $eventKey, 'lead' => $lead->id, 'error' => $e->getMessage()]);
        }
    }

    private function deliver(EmailAutomationMessage $msg, Lead $lead, array $context, string $department): void
    {
        if ($msg->recipient === 'client') {
            // The client is the lead — CommunicationService handles email/SMS
            // routing and message logging for us.
            if (! empty($lead->email) || ! empty($lead->phone)) {
                $this->comms->sendTemplated($msg->template_key, $lead, $context, $department);
            }

            return;
        }

        // Staff recipient — render the template with the case's context and send
        // to each resolved staff email as an internal notice.
        $emails = $this->staffEmails($msg->recipient, $lead);
        if (empty($emails)) {
            return;
        }

        $template = MessageTemplate::active()
            ->where('key', $msg->template_key)
            ->orderByRaw("CASE WHEN department = '' OR department IS NULL THEN 1 ELSE 0 END")
            ->orderByRaw("CASE WHEN department = ? THEN 0 ELSE 1 END", [$department])
            ->first();

        if (! $template) {
            return;
        }

        $subject = $this->comms->render($lead, (string) ($template->email_subject ?? ''), $context);
        $body = $this->comms->render($lead, (string) ($template->email_body ?? ''), $context);

        foreach (array_unique($emails) as $email) {
            $this->comms->sendComposedEmail($email, $subject !== '' ? $subject : 'Case update', $body, [], true, $lead->id);
        }
    }

    /** Resolve staff recipient role → email addresses for this case. */
    private function staffEmails(string $role, Lead $lead): array
    {
        $adviser = $this->adviserFor($lead);
        $manager = $this->managerFor($lead);

        return match ($role) {
            'adviser' => array_filter([$adviser?->email]),
            'manager' => array_filter([$manager?->email]),
            'team'    => array_filter([$adviser?->email, $manager?->email]),
            default   => [],
        };
    }

    /** The licensed adviser on the case: the engagement signer, else the named
     *  assignee, else the practice's designated signing adviser. */
    private function adviserFor(Lead $lead): ?User
    {
        $signerId = LeadDocument::where('lead_id', $lead->id)
            ->where('source_variant', 'engagement:written_agreement')
            ->value('engagement_signer_id');
        if ($signerId && ($u = User::find($signerId))) {
            return $u;
        }

        if (! empty($lead->immigration_assignee)) {
            $u = User::where('name', $lead->immigration_assignee)->first();
            if ($u) {
                return $u;
            }
        }

        $default = trim((string) config('immigration.signing_adviser'));
        if ($default !== '') {
            return User::where('name', $default)->first();
        }

        return null;
    }

    private function managerFor(Lead $lead): ?User
    {
        return User::where('role', 'immigration_manager')->orderBy('name')->first();
    }
}
