<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extra portal access — a staff user has one primary `role`, but may be granted
 * access to additional department portals (e.g. an education staffer who also
 * works immigration). Stored as a JSON list of portal keys; empty/null means
 * "just your role's portal".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('portal_access')->nullable()->after('module_permissions');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('portal_access');
        });
    }
};
