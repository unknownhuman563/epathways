<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Accommodation viewing bookings reference a property the same way immigration
 * consultation bookings reference a visa type. Nullable — non-accommodation
 * bookings leave it null.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('property_id')->nullable()->after('visa_type_id')
                ->constrained('accommodation_properties')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('property_id');
        });
    }
};
