<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links a lead_documents row to a checklist-item key (e.g. "pers.passport")
 * so we can group uploaded files under the Documents-tab checklist cards.
 * Nullable — existing rows uploaded via the legacy request flow stay untouched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->string('checklist_key', 120)->nullable()->after('request_id');
            $table->index(['lead_id', 'checklist_key']);
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropIndex(['lead_id', 'checklist_key']);
            $table->dropColumn('checklist_key');
        });
    }
};
