<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-lead ad-hoc document requirements. Staff can add a document row to a
 * single lead's Documents tab (e.g. a marriage certificate this one lead needs)
 * without touching the shared checklist. Each entry is {key, name}; uploads
 * attach to it by its `custom.*` checklist_key like any other checklist item.
 * Scoped to the one lead — no other lead sees it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('custom_documents')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('custom_documents');
        });
    }
};
