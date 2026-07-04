<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-case list of checklist keys that staff have hidden from the public
 * application tracking link. Items in this array are filtered out of the
 * tracker's document checklist while staff still see them internally.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('hidden_track_documents')->nullable()->after('document_checklist');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('hidden_track_documents');
        });
    }
};
