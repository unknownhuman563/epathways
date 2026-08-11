<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit link: which INZ form VERSION a generated document was filled against.
 * Filing a superseded version can get an application returned, so every filled
 * form must record its version, not just the form code.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->foreignId('inz_form_version_id')->nullable()->after('source_variant')
                ->constrained('inz_form_versions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inz_form_version_id');
        });
    }
};
