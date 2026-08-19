<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Folders become department-scoped so the admin Templates screen can present
 * one tab (container) per department. A folder now lives under a single
 * department; '' keeps a folder in the Shared (all-departments) tab, matching
 * the same empty-string sentinel used on message_templates.department.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('template_folders', function (Blueprint $table) {
            $table->string('department')->default('')->index()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('template_folders', function (Blueprint $table) {
            $table->dropIndex(['department']);
            $table->dropColumn('department');
        });
    }
};
