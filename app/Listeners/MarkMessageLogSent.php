<?php

namespace App\Listeners;

use App\Models\MessageLog;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Log;

/**
 * When a queued email actually reaches the mail server, Laravel fires
 * MessageSent. If the message carries an X-Log-Id header, flip that
 * MessageLog from 'queued' to 'sent' so the UI reflects real delivery.
 */
class MarkMessageLogSent
{
    public function handle(MessageSent $event): void
    {
        try {
            $headers = $event->sent->getOriginalMessage()->getHeaders();
            if (! $headers->has('X-Log-Id')) {
                return;
            }

            $id = (int) $headers->get('X-Log-Id')->getBodyAsString();
            if (! $id) {
                return;
            }

            MessageLog::where('id', $id)
                ->where('status', MessageLog::STATUS_QUEUED)
                ->update(['status' => MessageLog::STATUS_SENT, 'sent_at' => now()]);
        } catch (\Throwable $e) {
            // Never let status bookkeeping break mail delivery.
            Log::warning('MarkMessageLogSent failed', ['error' => $e->getMessage()]);
        }
    }
}
