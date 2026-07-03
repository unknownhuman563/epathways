<?php

namespace App\Services;

use App\Contracts\SmsProvider;
use App\Mail\TemplatedMessage;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\MessageTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * One door for outbound lead communication. Looks up a template, fills in
 * {{variables}}, routes to email and/or SMS, and records a MessageLog for
 * every send (success or failure). No AI, no scheduling — just the rails.
 */
class CommunicationService
{
    public function __construct(private SmsProvider $sms) {}

    /**
     * Send a keyed template to a lead across its configured channels.
     * When $department is given, the department's own version of the template
     * is preferred, falling back to the shared/global template of that key.
     *
     * @return array{email: ?MessageLog, sms: ?MessageLog}
     */
    public function sendTemplated(string $key, Lead $lead, array $extraContext = [], ?string $department = null): array
    {
        $template = MessageTemplate::resolve($key, $department);
        if (! $template) {
            Log::warning("CommunicationService: no active template '{$key}'", [
                'lead_id' => $lead->id, 'department' => $department,
            ]);

            return ['email' => null, 'sms' => null];
        }

        return $this->dispatch($template, $lead, $extraContext);
    }

    /**
     * Send a specific template instance to a lead (no key/department lookup).
     * Used by the editor's "send test" and the lead "send update" compose flow,
     * the latter optionally attaching files.
     *
     * @param  list<array{path: string, name: string}>  $attachments
     * @return array{email: ?MessageLog, sms: ?MessageLog}
     */
    public function sendTemplate(MessageTemplate $template, Lead $lead, array $extraContext = [], array $attachments = []): array
    {
        return $this->dispatch($template, $lead, $extraContext, $attachments);
    }

    /**
     * Render a resolved template's channels and send each configured one.
     * Attachments (if any) ride along on the email channel only.
     *
     * @param  list<array{path: string, name: string}>  $attachments
     * @return array{email: ?MessageLog, sms: ?MessageLog}
     */
    private function dispatch(MessageTemplate $template, Lead $lead, array $extraContext, array $attachments = []): array
    {
        $result = ['email' => null, 'sms' => null];

        $channels = $template->channels ?? [];
        if (empty($channels)) {
            Log::warning("CommunicationService: template '{$template->key}' has no channels", ['lead_id' => $lead->id]);

            return $result;
        }

        $context = $this->buildContext($lead, $extraContext);

        if (in_array('email', $channels, true) && ! empty($lead->email)) {
            $subject = $this->substitute((string) $template->email_subject, $context, false);
            $body = $this->substitute((string) $template->email_body, $context, true);
            $result['email'] = $this->sendEmail(
                $lead, $subject, $body, $template->key, $attachments, null,
                $template->banner_image,
                $template->footer_image,
            );
        }

        if (in_array('sms', $channels, true) && ! empty($lead->phone)) {
            $body = $this->substitute((string) $template->sms_body, $context, false);
            $result['sms'] = $this->sendSms($lead, $body, $template->key);
        }

        return $result;
    }

    /**
     * Send an ad-hoc message (no template lookup) to a lead on one channel.
     * Optional banner/footer image paths brand the email shell — pass a
     * template's images to match its look on a custom compose.
     */
    public function sendRaw(string $channel, Lead $lead, ?string $subject, string $body, ?string $bannerImage = null, ?string $footerImage = null): MessageLog
    {
        return $channel === MessageLog::CHANNEL_SMS
            ? $this->sendSms($lead, $body, null)
            : $this->sendEmail($lead, $subject ?? '(no subject)', $body, null, [], null, $bannerImage, $footerImage);
    }

    /**
     * Render free text against a lead's variable context — for personalised
     * previews and custom (template-free) sends. Mirrors the substitution the
     * templated path uses ({{first_name}}, {{client_portal_url}}, …).
     */
    public function render(Lead $lead, string $text, array $extra = [], bool $escape = false): string
    {
        return $this->substitute($text, $this->buildContext($lead, $extra), $escape);
    }

    /**
     * Send the same keyed template to many leads. One lead's failure never
     * aborts the batch — every lead yields a result row.
     *
     * @param  iterable<Lead>  $leads
     * @return array<int, array{lead_id:int, status:string, log_id:?int, error:?string}>
     */
    public function bulkSendTemplated(iterable $leads, MessageTemplate $template, array $extra = []): array
    {
        $results = [];

        foreach ($leads as $lead) {
            try {
                $sent = $this->sendTemplated($template->key, $lead, $extra);
                $log  = $sent['email'] ?? $sent['sms'];
                $failed = $log && $log->status === MessageLog::STATUS_FAILED;

                $results[] = [
                    'lead_id' => $lead->id,
                    'status'  => ($log && ! $failed) ? 'sent' : 'failed',
                    'log_id'  => $log?->id,
                    'error'   => $log?->error_message
                        ?? ($log ? null : 'No deliverable channel (missing email/phone or template has none).'),
                ];
            } catch (\Throwable $e) {
                Log::error('CommunicationService bulk send failed for lead', [
                    'lead_id' => $lead->id, 'error' => $e->getMessage(),
                ]);
                $results[] = ['lead_id' => $lead->id, 'status' => 'failed', 'log_id' => null, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Send an SMS to a bare phone number (no Lead) — used by the test
     * command and any future system-level alert. Logs a 'raw' MessageLog.
     */
    public function sendRawSms(string $phone, string $body): MessageLog
    {
        $to = $this->normalizePhone($phone);

        if (! $to) {
            return $this->log([
                'channel' => MessageLog::CHANNEL_SMS, 'recipient_type' => 'raw',
                'recipient_address' => $phone, 'body' => $body,
                'status' => MessageLog::STATUS_FAILED,
                'error_message' => 'Invalid phone number — could not normalize to E.164.', 'failed_at' => now(),
            ]);
        }

        $res = $this->sms->send($to, $body);

        return $this->log([
            'channel' => MessageLog::CHANNEL_SMS, 'recipient_type' => 'raw',
            'recipient_address' => $to, 'body' => $body,
            'status' => $res['ok'] ? MessageLog::STATUS_QUEUED : MessageLog::STATUS_FAILED,
            'provider_message_id' => $res['message_id'] ?? null,
            'error_message' => $res['ok'] ? null : ($res['error'] ?? 'SMS send failed.'),
            'failed_at' => $res['ok'] ? null : now(),
        ]);
    }

    // ─── Channels ─────────────────────────────────────────────────────────

    /**
     * Substitute and send a raw subject/body to a lead as part of a bulk
     * campaign, logging the row against that campaign. Returns true on a
     * successful queue so the job can tally sent/failed counts.
     */
    public function sendCampaignEmail(Lead $lead, string $subject, string $body, int $campaignId, array $extraContext = []): bool
    {
        if (empty($lead->email)) {
            $this->log([
                'campaign_id' => $campaignId, 'channel' => MessageLog::CHANNEL_EMAIL,
                'recipient_id' => $lead->id, 'recipient_address' => '',
                'subject' => $subject, 'status' => MessageLog::STATUS_FAILED,
                'error_message' => 'Lead has no email address.', 'failed_at' => now(),
            ]);

            return false;
        }

        $context = $this->buildContext($lead, $extraContext);
        $sub = $this->substitute($subject, $context, false);
        $bod = $this->substitute($body, $context, true);

        $log = $this->sendEmail($lead, $sub, $bod, null, [], $campaignId);

        return $log->status !== MessageLog::STATUS_FAILED;
    }

    private function sendEmail(Lead $lead, string $subject, string $body, ?string $key, array $attachments = [], ?int $campaignId = null, ?string $bannerImage = null, ?string $footerImage = null): MessageLog
    {
        // Log first (status 'queued'), then queue the mail carrying this log's
        // id. The MessageSent listener flips it to 'sent' once the worker
        // actually delivers it to the mail server.
        $log = $this->log([
            'template_key' => $key, 'campaign_id' => $campaignId, 'channel' => MessageLog::CHANNEL_EMAIL,
            'recipient_id' => $lead->id, 'recipient_address' => (string) $lead->email,
            'subject' => $subject, 'body' => $body, 'status' => MessageLog::STATUS_QUEUED,
        ]);

        try {
            Mail::to($lead->email)->queue(
                new TemplatedMessage($subject, $body, $attachments, $bannerImage, $footerImage, $log->id)
            );
        } catch (\Throwable $e) {
            Log::error('CommunicationService email failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
            $log->update([
                'status' => MessageLog::STATUS_FAILED,
                'error_message' => $e->getMessage(),
                'failed_at' => now(),
            ]);
        }

        return $log;
    }

    private function sendSms(Lead $lead, string $body, ?string $key): MessageLog
    {
        $to = $this->normalizePhone((string) $lead->phone);

        if (! $to) {
            return $this->log([
                'template_key' => $key, 'channel' => MessageLog::CHANNEL_SMS,
                'recipient_id' => $lead->id, 'recipient_address' => (string) $lead->phone,
                'body' => $body, 'status' => MessageLog::STATUS_FAILED,
                'error_message' => 'Invalid phone number — could not normalize to E.164.', 'failed_at' => now(),
            ]);
        }

        $res = $this->sms->send($to, $body);

        return $this->log([
            'template_key' => $key, 'channel' => MessageLog::CHANNEL_SMS,
            'recipient_id' => $lead->id, 'recipient_address' => $to, 'body' => $body,
            'status' => $res['ok'] ? MessageLog::STATUS_QUEUED : MessageLog::STATUS_FAILED,
            'provider_message_id' => $res['message_id'] ?? null,
            'error_message' => $res['ok'] ? null : ($res['error'] ?? 'SMS send failed.'),
            'failed_at' => $res['ok'] ? null : now(),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    /** Standard variables available to every template, plus per-send extras. */
    private function buildContext(Lead $lead, array $extra): array
    {
        $staff = $lead->assignee;

        return array_merge([
            'first_name' => $lead->first_name ?? '',
            'last_name' => $lead->last_name ?? '',
            'full_name' => trim("{$lead->first_name} {$lead->last_name}"),
            'email' => $lead->email ?? '',
            'phone' => $lead->phone ?? '',
            'stage' => $lead->stage ?? ($lead->status ?? ''),
            'tracker_url' => rtrim((string) config('app.url'), '/').'/track/'.$lead->tracking_code,
            'client_portal_url' => $this->clientPortalUrl($lead),
            'assigned_staff_name' => $staff?->name ?? 'the ePathways team',
        ], $extra);
    }

    /**
     * The best self-service link for this lead: their secured portal if they
     * have a portal account, else the public tracker link, else blank.
     */
    private function clientPortalUrl(Lead $lead): string
    {
        $base = rtrim((string) config('app.url'), '/');

        if ($lead->portalUser()->exists()) {
            return $base . '/portal/lead/dashboard';
        }

        if (! empty($lead->tracking_code)) {
            return $base . '/track/' . $lead->tracking_code;
        }

        return '';
    }

    /**
     * Replace {{ var }} tokens. Unknown variables become empty strings
     * (never crash). Email bodies HTML-escape the substituted values to
     * stop a lead's own data injecting markup; SMS stays plain.
     */
    private function substitute(string $template, array $context, bool $escape): string
    {
        return preg_replace_callback('/\{\{\s*([a-z0-9_]+)\s*\}\}/i', function ($m) use ($context, $escape) {
            $key = strtolower($m[1]);
            if (! array_key_exists($key, $context)) {
                Log::warning("CommunicationService: unknown template variable '{{{$key}}}'");

                return '';
            }
            $value = (string) $context[$key];

            return $escape ? e($value) : $value;
        }, $template) ?? $template;
    }

    /** Normalize a freeform phone to E.164 (default region NZ), or null. */
    private function normalizePhone(string $phone): ?string
    {
        $phone = trim($phone);
        if ($phone === '') {
            return null;
        }

        // Prefer libphonenumber when available; fall back to a basic NZ/E.164
        // normalizer so the service works even without the library.
        if (class_exists(\libphonenumber\PhoneNumberUtil::class)) {
            try {
                $util = \libphonenumber\PhoneNumberUtil::getInstance();
                $parsed = $util->parse($phone, 'NZ');
                if (! $util->isValidNumber($parsed)) {
                    return null;
                }

                return $util->format($parsed, \libphonenumber\PhoneNumberFormat::E164);
            } catch (\Throwable $e) {
                return null;
            }
        }

        return $this->basicNormalize($phone);
    }

    private function basicNormalize(string $phone): ?string
    {
        $digits = preg_replace('/[^\d+]/', '', $phone);
        if (str_starts_with($digits, '+') && strlen($digits) >= 8) {
            return $digits;
        }
        if (str_starts_with($digits, '0')) {           // NZ national → +64
            return '+64'.ltrim($digits, '0');
        }

        return strlen($digits) >= 8 ? '+'.$digits : null;
    }

    private function log(array $data): MessageLog
    {
        return MessageLog::create(array_merge([
            'recipient_type' => 'lead',
            'triggered_by_user_id' => auth()->id(),
            'sent_at' => null,
        ], $data));
    }
}
