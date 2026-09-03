<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The `missed_the_booking_1` / `missed_the_booking_2` email templates carry a
 * "Reschedule my consultation" button whose href was never updated to the
 * token-based reschedule flow — so it rendered as an empty/dead link. Repoint
 * any anchor in those two templates whose text mentions "reschedul" to the
 * {{reschedule_url}} variable (now resolved in CommunicationService for every
 * send path). Idempotent + a safe no-op if the templates/markup aren't present.
 */
return new class extends Migration
{
    public function up(): void
    {
        // message_templates may not exist on a bare test DB — bail quietly.
        if (! DB::getSchemaBuilder()->hasTable('message_templates')) {
            return;
        }

        $rows = DB::table('message_templates')
            ->whereIn('key', ['missed_the_booking_1', 'missed_the_booking_2'])
            ->get(['id', 'email_body']);

        foreach ($rows as $row) {
            $body = (string) $row->email_body;
            if ($body === '') {
                continue;
            }

            // Only touch anchors whose (possibly nested) content mentions
            // "reschedul" — the CTA button — and force their href to the var.
            $fixed = preg_replace_callback('/<a\b[^>]*>.*?<\/a>/is', function ($m) {
                $anchor = $m[0];
                if (stripos($anchor, 'reschedul') === false) {
                    return $anchor;
                }
                // Replace an existing href (single or double quoted); else inject one.
                if (preg_match('/\bhref\s*=\s*("[^"]*"|\'[^\']*\')/i', $anchor)) {
                    return preg_replace('/\bhref\s*=\s*("[^"]*"|\'[^\']*\')/i', 'href="{{reschedule_url}}"', $anchor, 1);
                }

                return preg_replace('/<a\b/i', '<a href="{{reschedule_url}}"', $anchor, 1);
            }, $body);

            if ($fixed !== null && $fixed !== $body) {
                DB::table('message_templates')->where('id', $row->id)->update([
                    'email_body' => $fixed,
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // No-op — we don't restore the previously-broken href.
    }
};
