<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            // Only the HOT form captures a specific property of interest; the
            // COLD form leaves this null.
            $table->string('property_interested')->nullable()->after('room_type_interest');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dropColumn('property_interested');
        });
    }
};
