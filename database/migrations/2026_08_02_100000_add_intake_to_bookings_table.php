<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Full consultation intake payload captured by the custom booking form,
 * stored verbatim on the booking (the old LazyMagnet form saved a blob too).
 * Key scalars are also mapped onto the linked lead for pipeline use.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->json('intake')->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('intake');
        });
    }
};
