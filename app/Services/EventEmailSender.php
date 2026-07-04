<?php

namespace App\Services;

use App\Models\Event;
use App\Models\EventSession;
use App\Models\MessageLog;
use App\Models\MessageTemplate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Sends a composed email to an event's registrants — shared by the Email tab
 * (send now) and the scheduled-email job. Renders {{first_name}} plus the
 * event's {{event_*}} variables per lead through the branded shell, matching a
 * template's banner/footer when one was used.
 */
class EventEmailSender
{
    public function __construct(private CommunicationService $comms) {}

    /**
     * Send $subject/$body to the given registrants of $event.
     *
     * @param  array<int>  $recipientIds
     * @return array{sent:int, failed:int}
     */
    public function send(Event $event, array $recipientIds, string $subject, string $body, ?MessageTemplate $template = null): array
    {
        $recipients = $event->leads()
            ->whereIn('leads.id', $recipientIds)
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->get();

        $eventCtx = $this->context($event, null);
        $banner = $template?->banner_image;
        $footer = $template?->footer_image;
        $fromEmail = $template?->from_email;
        $fromName = $template?->from_name;

        $sent = 0;
        $failed = 0;

        foreach ($recipients as $lead) {
            try {
                $renderedSubject = $this->comms->render($lead, $subject, $eventCtx, false);
                $renderedBody = $this->comms->render($lead, $body, $eventCtx, true);
                $log = $this->comms->sendRaw('email', $lead, $renderedSubject, $renderedBody, $banner, $footer, $fromEmail, $fromName);
                $log->status === MessageLog::STATUS_FAILED ? $failed++ : $sent++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error('Event registrant email failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
            }
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    /**
     * Variables handed to event emails — the event's name plus human-friendly
     * date/time/location (preferring the session the lead picked). Falls back
     * to "To be confirmed" so the email never shows a blank field.
     */
    public function context(Event $event, ?EventSession $session): array
    {
        $parse = function ($v) {
            if (! $v) {
                return null;
            }
            try {
                return Carbon::parse($v);
            } catch (\Throwable) {
                return null;
            }
        };

        $dateFrom = $parse($session?->date ?? $event->date_from);
        // date_to only applies to an event-level range, not a single session.
        $dateTo = $session ? null : $parse($event->date_to);
        $start = $parse($session?->time_start ?? $event->time_start);
        $end = $parse($session?->time_end ?? $event->time_end);

        if ($dateFrom && $dateTo && ! $dateFrom->isSameDay($dateTo)) {
            $date = $dateFrom->isSameMonth($dateTo)
                ? $dateFrom->format('j').' – '.$dateTo->format('j F Y')
                : $dateFrom->format('j F').' – '.$dateTo->format('j F Y');
        } else {
            $date = $dateFrom?->translatedFormat('l, j F Y');
        }

        $time = $start
            ? ($end ? $start->format('g:i A').' – '.$end->format('g:i A') : $start->format('g:i A'))
            : null;

        $location = null;
        if ($session) {
            $location = trim(implode(', ', array_filter([$session->venue_name, $session->city]))) ?: null;
        }
        $location = $location ?? $event->location ?? match ($event->mode) {
            'online' => 'Online',
            'hybrid' => 'Hybrid (online & in-person)',
            default => null,
        };

        return [
            'event_name' => $event->name,
            'event_date' => $date ?: 'To be confirmed',
            'event_time' => $time ?: 'To be confirmed',
            'event_location' => $location ?: 'To be confirmed',
        ];
    }
}
