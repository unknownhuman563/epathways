<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fix duplicate bookings at the database level. The public booking endpoint had
 * no idempotency guard, so a double-clicked button / a booking widget re-firing
 * its completion event created identical rows (same lead + service + slot).
 *
 * This migration (1) removes existing duplicates, keeping the EARLIEST id in
 * each (lead_id, appointment_date, appointment_time, service_type) group — the
 * copies are byte-for-byte the same booking — and (2) adds a unique index so the
 * database itself refuses a duplicate from then on. booking_reminders cascade
 * on delete, so a removed duplicate's reminders go with it; lead documents are
 * keyed to the lead, not the booking, so they are untouched.
 *
 * NULL slots (walk-in enquiries with no chosen date/time) are treated as
 * distinct by the unique index — those are guarded in the controller by a short
 * repeat-window instead, so a genuine later enquiry can still book.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            // Keep MIN(id) per duplicate group; delete the rest (NULL-safe join).
            DB::statement('
                DELETE b FROM bookings b
                JOIN (
                    SELECT MIN(id) AS keep_id, lead_id, appointment_date, appointment_time, service_type
                    FROM bookings
                    GROUP BY lead_id, appointment_date, appointment_time, service_type
                    HAVING COUNT(*) > 1
                ) d
                  ON b.lead_id <=> d.lead_id
                 AND b.appointment_date <=> d.appointment_date
                 AND b.appointment_time <=> d.appointment_time
                 AND b.service_type <=> d.service_type
                 AND b.id <> d.keep_id
            ');

            // Prefix lengths keep the composite key under the InnoDB index limit.
            DB::statement('
                ALTER TABLE bookings
                ADD UNIQUE INDEX bookings_dedupe_unique
                (lead_id, appointment_date, appointment_time(50), service_type(100))
            ');

            return;
        }

        // SQLite / others (test DB starts empty, so no dedupe pass needed).
        Schema::table('bookings', function (Blueprint $table) {
            $table->unique(['lead_id', 'appointment_date', 'appointment_time', 'service_type'], 'bookings_dedupe_unique');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique('bookings_dedupe_unique');
        });
    }
};
