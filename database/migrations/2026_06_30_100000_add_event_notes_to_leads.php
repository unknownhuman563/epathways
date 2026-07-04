<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-registrant notes attached to a lead that came in via an event.
 * Owned by the event view (staff annotate what they discussed with the
 * registrant / follow-up state) — separate from the general lead notes
 * so event-desk staff and lead-management staff don't step on each
 * other's context.
 *
 * `event_notes_updated_by` is a soft foreign key to users — nullable
 * so a lead whose staff editor was later deleted still shows the note.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'event_notes')) {
                $table->text('event_notes')->nullable()->after('event_response');
            }
            if (! Schema::hasColumn('leads', 'event_notes_updated_at')) {
                $table->timestamp('event_notes_updated_at')->nullable()->after('event_notes');
            }
            if (! Schema::hasColumn('leads', 'event_notes_updated_by')) {
                $table->unsignedBigInteger('event_notes_updated_by')->nullable()->after('event_notes_updated_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            foreach (['event_notes', 'event_notes_updated_at', 'event_notes_updated_by'] as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
