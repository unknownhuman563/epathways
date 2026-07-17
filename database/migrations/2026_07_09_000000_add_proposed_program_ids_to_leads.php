<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A "Proposal" on the Proposal & Agreements page isn't a PDF — it's a
 * shortlist of up to 3 programs the staff have suggested for the lead
 * to pick from on their public tracker. Storing the picks as a JSON
 * array on the leads row keeps it cheap (no join, no pivot) and matches
 * how other tracker-facing prefs (hidden_track_documents) already live.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('proposed_program_ids')->nullable()->after('hidden_track_documents');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('proposed_program_ids');
        });
    }
};
