<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Renames "complaints" to the more neutral "concerns", and adds a status
 * (new / investigating / checked / fixed) plus an assignee so staff can track
 * who is handling each concern and whether it has been resolved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('accommodation_complaints', 'accommodation_concerns');

        Schema::table('accommodation_concerns', function (Blueprint $table) {
            $table->string('status', 20)->default('new')->after('message');
            $table->foreignId('assigned_to_user_id')->nullable()->after('status')
                ->constrained('users')->nullOnDelete();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_concerns', function (Blueprint $table) {
            $table->dropForeign(['assigned_to_user_id']);
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'assigned_to_user_id']);
        });

        Schema::rename('accommodation_concerns', 'accommodation_complaints');
    }
};
