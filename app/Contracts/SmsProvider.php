<?php

namespace App\Contracts;

/**
 * Pluggable SMS transport. The default binding is NullSmsProvider (SMS
 * disabled); TwilioSmsProvider replaces it when Twilio is configured.
 */
interface SmsProvider
{
    /**
     * Send an SMS. Returns a structured result — never throws for an
     * expected provider failure (those become a 'failed' MessageLog).
     *
     * @return array{ok: bool, message_id: ?string, status: ?string, error: ?string}
     */
    public function send(string $to, string $body): array;

    public function isConfigured(): bool;
}
