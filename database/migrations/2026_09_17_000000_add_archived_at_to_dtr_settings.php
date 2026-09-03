<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Archive staff in the DTR Setup Manager (e.g. ex-employees) without deleting
 * their records. Keyed on the per-user dtr_settings row; archiving a staff
 * member who was never set up creates a stub row carrying only archived_at.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dtr_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('dtr_settings', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('is_complete');
            }
        });
    }

    public function down(): void
    {
        Schema::table('dtr_settings', function (Blueprint $table) {
            $table->dropColumn('archived_at');
        });
    }
};
