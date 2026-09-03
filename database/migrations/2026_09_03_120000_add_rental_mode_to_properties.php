<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rental-mode toggle on accommodation properties.
 *
 * Existing rows are "per_room" (the only shape supported until now) so
 * the default keeps everything backward-compatible — no data migration
 * needed. When mode = 'whole_property' the per-room fields
 * (rent_single / rent_couple / room_type / bed_type / bathroom_type /
 * has_wardrobe) are ignored and the new whole-property fields drive
 * the listing + rent.
 *
 * bond_total_nzd + advance_total_nzd already exist and stay visible
 * in both modes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->string('rental_mode', 20)->default('per_room')->after('property_type');
            $table->decimal('whole_property_rent_weekly', 10, 2)->nullable()->after('rent_couple');
            $table->unsignedTinyInteger('bedrooms')->nullable()->after('whole_property_rent_weekly');
            $table->unsignedTinyInteger('bathrooms')->nullable()->after('bedrooms');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->dropColumn(['rental_mode', 'whole_property_rent_weekly', 'bedrooms', 'bathrooms']);
        });
    }
};
