<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Screenshots on a system ticket — up to 5 images the submitter attaches so
 * the admin can see exactly which part of the system they mean. Stored as a
 * JSON array of private-disk paths; served through an auth-gated stream.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_tickets', function (Blueprint $table) {
            $table->json('images')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('system_tickets', function (Blueprint $table) {
            $table->dropColumn('images');
        });
    }
};
