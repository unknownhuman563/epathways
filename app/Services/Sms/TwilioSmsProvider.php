<?php

namespace App\Services\Sms;

use App\Contracts\SmsProvider;
use Twilio\Rest\Client;

/**
 * Twilio-backed SMS. Sends via Twilio\Rest\Client; on success returns
 * Twilio's accepted message SID + status (typically 'queued'). Any
 * provider error is caught and reported as a failed result rather than
 * thrown, so a bad send becomes a 'failed' MessageLog, never a 500.
 *
 * The optional $client seam lets tests inject a fake (duck-typed
 * ->messages->create()) instead of hitting the real API.
 */
class TwilioSmsProvider implements SmsProvider
{
    public function __construct(
        private ?string $sid,
        private ?string $token,
        private ?string $from,
        private ?object $client = null,
    ) {}

    public function isConfigured(): bool
    {
        return ! empty($this->sid) && ! empty($this->token) && ! empty($this->from);
    }

    public function send(string $to, string $body): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'message_id' => null, 'status' => null, 'error' => 'SMS disabled — Twilio not configured.'];
        }

        try {
            $client = $this->client ?? new Client($this->sid, $this->token);
            $message = $client->messages->create($to, ['from' => $this->from, 'body' => $body]);

            return [
                'ok'         => true,
                'message_id' => $message->sid ?? null,
                'status'     => $message->status ?? 'queued',
                'error'      => null,
            ];
        } catch (\Throwable $e) {
            return ['ok' => false, 'message_id' => null, 'status' => null, 'error' => $e->getMessage()];
        }
    }
}
