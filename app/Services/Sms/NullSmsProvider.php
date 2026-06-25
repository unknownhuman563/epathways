<?php

namespace App\Services\Sms;

use App\Contracts\SmsProvider;

/**
 * Default SMS provider for environments where Twilio isn't configured.
 * Every send fails cleanly so the system runs in dev without SMS creds.
 */
class NullSmsProvider implements SmsProvider
{
    public function isConfigured(): bool
    {
        return false;
    }

    public function send(string $to, string $body): array
    {
        return [
            'ok'         => false,
            'message_id' => null,
            'status'     => null,
            'error'      => 'SMS disabled — Twilio not configured.',
        ];
    }
}
