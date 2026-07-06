<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Older events carry status/mode values that predate the current enums
 * (e.g. status "published", mode "in_person"), which fail the store/update
 * validators (`in:draft,upcoming,ongoing,completed,cancelled` and
 * `in:in-person,online,hybrid`) — so those events can't be saved from the
 * editor. Normalize them to the closest valid value.
 */
return new class extends Migration
{
    public function up(): void
    {
        $validStatuses = ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'];

        // Underscore → hyphen for mode.
        DB::table('events')->where('mode', 'in_person')->update(['mode' => 'in-person']);
        // Anything not one of the three valid modes → in-person.
        DB::table('events')->whereNotIn('mode', ['in-person', 'online', 'hybrid'])->update(['mode' => 'in-person']);

        // Legacy "published" (and any other out-of-range status) → upcoming.
        DB::table('events')->whereNotIn('status', $validStatuses)->update(['status' => 'upcoming']);
    }

    public function down(): void
    {
        // Not reversible — the original legacy values aren't recoverable and
        // weren't valid to begin with.
    }
};
