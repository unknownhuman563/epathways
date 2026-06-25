<?php

namespace App\Console\Commands;

use App\Models\MessageLog;
use App\Services\CommunicationService;
use Illuminate\Console\Command;

/**
 * Fire a one-off SMS to confirm the Twilio integration works in any
 * environment. Logs a MessageLog row like any other send.
 *
 *   php artisan ep:test-sms "+64211234567" "Hello from ePathways"
 */
class TestSms extends Command
{
    protected $signature = 'ep:test-sms {phone : Destination number} {message=ePathways test message}';

    protected $description = 'Send a test SMS via the configured provider.';

    public function handle(CommunicationService $comms): int
    {
        $log = $comms->sendRawSms($this->argument('phone'), $this->argument('message'));

        if ($log->status === MessageLog::STATUS_QUEUED) {
            $this->info("SMS accepted → {$log->recipient_address} (provider id: " . ($log->provider_message_id ?? 'n/a') . ").");

            return self::SUCCESS;
        }

        $this->error("SMS failed → {$log->recipient_address}: {$log->error_message}");

        return self::FAILURE;
    }
}
