<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sub-agent "how do I reach this person" facts live in their OWN 1-to-1 table,
 * keyed by lead_id — never as columns or a JSON blob on the 200+ column `leads`
 * god table (which sits at InnoDB's ~8126-byte in-row limit; see CLAUDE.md and
 * docs/refactors/leads-table-split.md).
 *
 * Keeping this off `leads` means it can never trip the production-only
 * SQLSTATE 1118 "row too large" failure, and it is already the satellite shape
 * the leads-table-split plan wants. This replaces the earlier
 * `leads.contact_profile` JSON column, which was never deployed to production.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('lead_contact_profiles')) {
            Schema::create('lead_contact_profiles', function (Blueprint $t) {
                $t->id();
                $t->foreignId('lead_id')->unique()->constrained()->cascadeOnDelete();
                $t->string('best_time_to_call', 120)->nullable();
                $t->string('preferred_channel', 60)->nullable();
                $t->string('languages', 200)->nullable();
                $t->string('emergency_contact', 200)->nullable();
                $t->string('goal', 300)->nullable();
                $t->timestamps();
            });
        }

        // If an earlier (never-deployed) migration added the interim
        // leads.contact_profile JSON column on a dev/local DB, lift any values it
        // holds into the new table and then drop the column. On production the
        // column never existed, so both steps are skipped.
        if (Schema::hasColumn('leads', 'contact_profile')) {
            DB::table('leads')
                ->whereNotNull('contact_profile')
                ->orderBy('id')
                ->select('id', 'contact_profile')
                ->chunk(200, function ($leads) {
                    foreach ($leads as $lead) {
                        $data = json_decode((string) $lead->contact_profile, true);
                        if (! is_array($data) || ! $data) {
                            continue;
                        }
                        DB::table('lead_contact_profiles')->updateOrInsert(
                            ['lead_id' => $lead->id],
                            [
                                'best_time_to_call' => $data['best_time_to_call'] ?? null,
                                'preferred_channel' => $data['preferred_channel'] ?? null,
                                'languages' => $data['languages'] ?? null,
                                'emergency_contact' => $data['emergency_contact'] ?? null,
                                'goal' => $data['goal'] ?? null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ],
                        );
                    }
                });

            // Dropping a column only shrinks the row, so this is safe even on a
            // maxed-out table.
            Schema::table('leads', fn (Blueprint $t) => $t->dropColumn('contact_profile'));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_contact_profiles');
    }
};
