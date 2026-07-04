<?php

namespace App\Console\Commands;

use App\Models\EmailReply;
use App\Models\Lead;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Webklex\PHPIMAP\ClientManager;

/**
 * Polls the monitored mailbox (config services.imap — e.g. hello@epathways.ph
 * on Google Workspace) for new email replies, matches each to a lead by sender
 * address, and stores it for the Email Replies inbox. Idempotent: dedupes by
 * IMAP Message-ID, and only reads messages from the last N days.
 *
 * Scheduled every few minutes (see bootstrap/app.php or the scheduler).
 */
class SyncEmailReplies extends Command
{
    protected $signature = 'email:sync-replies {--days=3 : Only look back this many days}';

    protected $description = 'Pull inbound email replies from the monitored IMAP mailbox into the system';

    public function handle(): int
    {
        // Headroom for the IMAP fetch — no PHP time cap (runs on CLI/queue,
        // never the web request), and room to parse large multipart bodies.
        @set_time_limit(0);
        @ini_set('memory_limit', '1024M');

        $cfg = config('services.imap');
        if (empty($cfg['username']) || empty($cfg['password'])) {
            $this->warn('IMAP not configured (set IMAP_USERNAME / IMAP_PASSWORD). Skipping.');

            return self::SUCCESS;
        }

        try {
            $client = (new ClientManager())->make([
                'host' => $cfg['host'],
                'port' => $cfg['port'],
                'encryption' => $cfg['encryption'],
                'validate_cert' => true,
                'username' => $cfg['username'],
                'password' => $cfg['password'],
                'protocol' => 'imap',
                // Bound the connection so a slow/hung IMAP server can never
                // stall the queue worker indefinitely.
                'timeout' => 30,
            ]);
            $client->connect();
        } catch (\Throwable $e) {
            Log::error('SyncEmailReplies: IMAP connect failed', ['error' => $e->getMessage()]);
            $this->error('IMAP connect failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $since = Carbon::now()->subDays((int) $this->option('days'));
        $stored = 0;

        try {
            $folder = $client->getFolder($cfg['folder'] ?? 'INBOX');

            // Fetch HEADERS ONLY for the newest messages (cheap, low memory);
            // bodies are parsed per-message below so one big email can't blow
            // the whole batch.
            $messages = $folder->query()
                ->since($since)
                ->setFetchBody(false)
                ->setFetchFlags(false)
                ->fetchOrderDesc()
                ->leaveUnread()
                ->limit(35)
                ->get();

            foreach ($messages as $message) {
                try {
                    $mid = (string) ($message->getMessageId() ?? '');
                    // Already stored → skip without fetching its body.
                    if ($mid !== '' && EmailReply::where('message_id', $mid)->exists()) {
                        continue;
                    }

                    // Match the SENDER (a header) to a lead BEFORE parsing the
                    // body. This skips unrelated inbox mail — some of which has
                    // huge attachments that would exhaust memory on parse — and
                    // only ever downloads bodies for real lead replies.
                    $fromEmail = strtolower(trim((string) ($message->getFrom()[0]->mail ?? '')));
                    if ($fromEmail === '') {
                        continue;
                    }
                    $leadId = Lead::whereRaw('LOWER(email) = ?', [$fromEmail])->value('id');
                    if (! $leadId) {
                        continue;
                    }

                    $message->parseBody(); // fetch + parse just this lead reply
                    if ($this->store($message, $fromEmail, $leadId)) {
                        $stored++;
                    }
                } catch (\Throwable $e) {
                    Log::warning('SyncEmailReplies: failed to store a message', ['error' => $e->getMessage()]);
                } finally {
                    unset($message);
                    gc_collect_cycles();
                }
            }
        } catch (\Throwable $e) {
            Log::error('SyncEmailReplies: fetch failed', ['error' => $e->getMessage()]);
            $this->error('Fetch failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info("Synced {$stored} new repl".($stored === 1 ? 'y' : 'ies').'.');

        return self::SUCCESS;
    }

    /** Persist one parsed lead reply as an inbound EmailReply. */
    private function store($message, string $fromEmail, int $leadId): bool
    {
        $fromAddr = $message->getFrom()[0] ?? null;

        $date = $message->getDate();
        $receivedAt = $date instanceof \Carbon\CarbonInterface ? $date : Carbon::now();

        EmailReply::create([
            'lead_id' => $leadId,
            'direction' => 'inbound',
            'from_email' => $fromEmail,
            'from_name' => $this->decodeHeader((string) ($fromAddr->personal ?? '')) ?: null,
            'subject' => $this->decodeHeader((string) ($message->getSubject() ?? '')) ?: null,
            'body_text' => (string) ($message->getTextBody() ?? '') ?: null,
            'body_html' => (string) ($message->getHTMLBody() ?? '') ?: null,
            'message_id' => (string) ($message->getMessageId() ?? '') ?: null,
            'in_reply_to' => (string) ($message->getInReplyTo() ?? '') ?: null,
            'received_at' => $receivedAt,
            'is_read' => false,
        ]);

        return true;
    }

    /** Decode RFC 2047 MIME encoded-words (=?UTF-8?Q?…?=) into plain UTF-8. */
    private function decodeHeader(string $s): string
    {
        if ($s === '' || ! str_contains($s, '=?')) {
            return trim($s);
        }

        // iconv handles Q-encoding underscores-as-spaces correctly; fall back
        // to mb_* if iconv isn't available or errors.
        $decoded = @iconv_mime_decode($s, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
        if ($decoded === false || $decoded === '') {
            $decoded = @mb_decode_mimeheader($s);
        }

        return trim($decoded !== false ? $decoded : $s);
    }
}

