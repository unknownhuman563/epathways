<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            // Map of document-checklist key => stored file path (private disk).
            $table->json('document_files')->nullable()->after('documents');
        });
    }

    public function down(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            $table->dropColumn('document_files');
        });
    }
};
