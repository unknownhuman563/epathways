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
     *
     * @return array{email: ?MessageLog, sms: ?MessageLog}
     */
    public function sendTemplated(string $key, Lead $lead, array $extraContext = []): array
    {
        $result = ['email' => null, 'sms' => null];

        $template = MessageTemplate::active()->where('key', $key)->first();
        if (! $template) {
            Log::warning("CommunicationService: no active template '{$key}'", ['lead_id' => $lead->id]);

            return $result;
        }

        $channels = $template->channels ?? [];
        if (empty($channels)) {
            Log::warning("CommunicationService: template '{$key}' has no channels", ['lead_id' => $lead->id]);

            return $result;
        }

        $context = $this->buildContext($lead, $extraContext);

        if (in_array('email', $channels, true) && ! empty($lead->email)) {
            $subject = $this->substitute((string) $template->email_subject, $context, false);
            $body    = $this->substitute((string) $template->email_body, $context, true);
            $result['email'] = $this->sendEmail($lead, $subject, $body, $key);
        }

        if (in_array('sms', $channels, true) && ! empty($lead->phone)) {
            $body = $this->substitute((string) $template->sms_body, $context, false);
            $result['sms'] = $this->sendSms($lead, $body, $key);
        }

        return $result;
    }

    /**
     * Send an ad-hoc message (no template) to a lead on one channel.
     */
    public function sendRaw(string $channel, Lead $lead, ?string $subject, string $body): MessageLog
    {
        return $channel === MessageLog::CHANNEL_SMS
            ? $this->sendSms($lead, $body, null)
            : $this->sendEmail($lead, $subject ?? '(no subject)', $body, null);
    }

    // ─── Channels ─────────────────────────────────────────────────────────

    private function sendEmail(Lead $lead, string $subject, string $body, ?string $key): MessageLog
    {
        try {
            Mail::to($lead->email)->queue(new TemplatedMessage($subject, $body));

            return $this->log([
                'template_key' => $key, 'channel' => MessageLog::CHANNEL_EMAIL,
                'recipient_id' => $lead->id, 'recipient_address' => $lead->email,
                'subject' => $subject, 'body' => $body, 'status' => MessageLog::STATUS_QUEUED,
            ]);
        } catch (\Throwable $e) {
            Log::error('CommunicationService email failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);

            return $this->log([
                'template_key' => $key, 'channel' => MessageLog::CHANNEL_EMAIL,
                'recipient_id' => $lead->id, 'recipient_address' => (string) $lead->email,
                'subject' => $subject, 'body' => $body,
                'status' => MessageLog::STATUS_FAILED, 'error_message' => $e->getMessage(), 'failed_at' => now(),
            ]);
        }
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
            'first_name'          => $lead->first_name ?? '',
            'last_name'           => $lead->last_name ?? '',
            'full_name'           => trim("{$lead->first_name} {$lead->last_name}"),
            'email'               => $lead->email ?? '',
            'phone'               => $lead->phone ?? '',
            'tracker_url'         => rtrim((string) config('app.url'), '/') . '/track/' . $lead->tracking_code,
            'assigned_staff_name' => $staff?->name ?? 'the ePathways team',
        ], $extra);
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
            return '+64' . ltrim($digits, '0');
        }

        return strlen($digits) >= 8 ? '+' . $digits : null;
    }

    private function log(array $data): MessageLog
    {
        return MessageLog::create(array_merge([
            'recipient_type'       => 'lead',
            'triggered_by_user_id' => auth()->id(),
            'sent_at'              => null,
        ], $data));
    }
}
