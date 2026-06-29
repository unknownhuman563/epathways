<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scopes message templates to a department. An empty department ('') = a
 * shared, system-wide template (the original behaviour); a role value = a
 * template owned and edited by that department portal. The `key` uniqueness
 * moves from global to per-department so every department can own, e.g., its
 * own `application_status_update`.
 *
 * '' (not NULL) is the shared sentinel on purpose: SQL treats NULLs as
 * distinct in a unique index, which would let two shared templates share a
 * key. An empty string keeps the (department, key) unique guarantee intact.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->string('department')->default('')->after('key')->index();
            $table->dropUnique(['key']);
            $table->unique(['department', 'key']);
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropUnique(['department', 'key']);
            $table->unique('key');
            $table->dropIndex(['department']);
            $table->dropColumn('department');
        });
    }
};
