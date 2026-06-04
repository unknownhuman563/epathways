<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Soft link back to the resident intake the booking was claimed from.
            // Nullable because legacy bookings + the public booking form on
            // /book-now don't originate from an intake.
            $table->foreignId('resident_intake_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropConstrainedForeignId('resident_intake_id');
        });
    }
};
