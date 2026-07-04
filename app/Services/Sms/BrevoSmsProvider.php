<?php

namespace App\Services\Sms;

use App\Contracts\SmsProvider;
use Illuminate\Support\Facades\Http;

/**
 * Brevo-backed SMS via the Transactional SMS API
 * (POST /v3/transactionalSMS/sms). Needs a Brevo v3 API key (xkeysib-…, from
 * Brevo → SMTP & API → API Keys — NOT the SMTP password) and a sender name
 * (max 11 alphanumeric chars, or a purchased number). Any error is returned as
 * a failed result rather than thrown, so a bad send becomes a failed MessageLog.
 */
class BrevoSmsProvider implements SmsProvider
{
    private const ENDPOINT = 'https://api.brevo.com/v3/transactionalSMS/sms';

    public function __construct(
        private ?string $apiKey,
        private ?string $sender,
    ) {}

    public function isConfigured(): bool
    {
        return ! empty($this->apiKey) && ! empty($this->sender);
    }

    public function send(string $to, string $body): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'message_id' => null, 'status' => null, 'error' => 'SMS disabled — Brevo not configured.'];
        }

        try {
            $res = Http::withHeaders(['api-key' => $this->apiKey])
                ->acceptJson()
                ->asJson()
                ->timeout(20)
                ->post(self::ENDPOINT, [
                    'sender' => $this->sender,
                    'recipient' => $to,
                    'content' => $body,
                    'type' => 'transactional',
                ]);

            if ($res->failed()) {
                return [
                    'ok' => false, 'message_id' => null, 'status' => null,
                    'error' => $res->json('message') ?? ('Brevo SMS error (HTTP '.$res->status().')'),
                ];
            }

            return [
                'ok' => true,
                'message_id' => (string) ($res->json('messageId') ?? $res->json('reference') ?? ''),
                'status' => 'sent',
                'error' => null,
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message_id' => null, 'status' => null, 'error' => $e->getMessage()];
        }
    }
}
