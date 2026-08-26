<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-case document state: edited | awaiting_signature | signed | needs_manager.
// Defaults to "edited" when a format is applied; workflow transitions come later.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_format_case', function (Blueprint $table) {
            $table->string('state', 24)->default('edited')->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('document_format_case', function (Blueprint $table) {
            $table->dropColumn('state');
        });
    }
};
