<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add the shared document tab (same two-column pattern as Resident/Work) to the
 * Student, Visitor and Family intakes:
 *   - `documents`      json: checklist ticks / answers.
 *   - `document_files` json: map of checklist key => stored file paths (private
 *     `local` disk). IntakeDocumentMigrator carries these onto the case at
 *     conversion, and the assessment-module intake view lists them.
 */
return new class extends Migration
{
    private array $tables = ['student_intakes', 'visitor_intakes', 'family_intakes'];

    public function up(): void
    {
        foreach ($this->tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) use ($table) {
                if (! Schema::hasColumn($table, 'documents')) {
                    $t->json('documents')->nullable();
                }
                if (! Schema::hasColumn($table, 'document_files')) {
                    $t->json('document_files')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, fn (Blueprint $t) => $t->dropColumn(['documents', 'document_files']));
            }
        }
    }
};
