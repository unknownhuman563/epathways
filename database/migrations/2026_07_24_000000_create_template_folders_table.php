<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Folders for grouping message templates. Folders are shared/global — the
 * same as the template library itself (every portal + admin sees all
 * templates), so a folder created from any portal is visible everywhere.
 * Deleting a folder nulls folder_id on its templates (nullOnDelete) rather
 * than removing them — templates outlive their folder.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('message_templates', function (Blueprint $table) {
            $table->foreignId('folder_id')->nullable()->after('department')
                ->constrained('template_folders')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('folder_id');
        });

        Schema::dropIfExists('template_folders');
    }
};
