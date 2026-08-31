<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restricted modules this user is granted (JSON array of module keys
            // from config/modules.php `restricted`). Null/empty = none granted;
            // super admins always see every restricted module regardless. Only
            // restricted modules are gated here — grandfathered modules ignore it.
            if (! Schema::hasColumn('users', 'module_permissions')) {
                $table->json('module_permissions')->nullable()->after('role');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('module_permissions');
        });
    }
};
