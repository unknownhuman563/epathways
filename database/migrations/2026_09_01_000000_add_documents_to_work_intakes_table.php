<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Work Interest & Qualifications" document tab for the AEWV intake — mirrors
 * the Resident intake's two-column pattern:
 *   - `documents`      json: checklist answers (e.g. the PCC yes/no question).
 *   - `document_files` json: map of document-checklist key => stored file paths
 *     (on the private `local` disk). IntakeDocumentMigrator carries these onto
 *     the case's Documents tab at conversion.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_intakes', function (Blueprint $t) {
            if (! Schema::hasColumn('work_intakes', 'documents')) {
                $t->json('documents')->nullable()->after('travel_trips');
            }
            if (! Schema::hasColumn('work_intakes', 'document_files')) {
                $t->json('document_files')->nullable()->after('documents');
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_intakes', function (Blueprint $t) {
            $t->dropColumn(['documents', 'document_files']);
        });
    }
};
