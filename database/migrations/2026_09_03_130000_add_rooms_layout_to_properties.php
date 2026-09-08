<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Structured room-by-room layout for whole-property listings. Nullable JSON
 * array of { name, type, bed, ensuite, notes } — displayed as a table on
 * the public listing so prospects can see what's actually in the house.
 * Not used in per_room mode.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->json('rooms_layout')->nullable()->after('bathrooms');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->dropColumn('rooms_layout');
        });
    }
};
