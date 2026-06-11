<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-visa-type document checklist. Each entry is:
        //   { key: string, label: string, hint?: string, required: bool }
        // The lead's /track page renders this list and matches each item
        // against the documents they've uploaded (LeadDocument.checklist_key)
        // so they can see at a glance what's still missing.
        Schema::table('visa_types', function (Blueprint $table) {
            $table->json('checklist_items')->nullable()->after('inz_form_refs');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn('checklist_items');
        });
    }
};
