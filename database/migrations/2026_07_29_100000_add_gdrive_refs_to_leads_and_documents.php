<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Google Drive sync references.
 *
 * - leads.gdrive_folder_id      — the Drive folder ID for this client's own
 *   folder inside the Shared Drive. Created lazily on the first approved
 *   document. (`student_gdrive_link` still holds the human folder URL.)
 * - lead_documents.gdrive_file_id — the Drive file ID once an APPROVED
 *   document has been pushed. Presence makes the push idempotent: a
 *   re-approval updates the same file rather than creating a duplicate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('gdrive_folder_id', 128)->nullable()->after('student_gdrive_link');
        });

        Schema::table('lead_documents', function (Blueprint $table) {
            $table->string('gdrive_file_id', 128)->nullable()->after('source_variant');
            $table->timestamp('gdrive_synced_at')->nullable()->after('gdrive_file_id');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('gdrive_folder_id');
        });

        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropColumn(['gdrive_file_id', 'gdrive_synced_at']);
        });
    }
};
