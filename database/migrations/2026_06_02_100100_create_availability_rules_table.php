<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('availability_rules', function (Blueprint $table) {
            $table->id();
            // 0 = Sunday … 6 = Saturday (matches PHP's `w` date format).
            $table->unsignedTinyInteger('day_of_week');
            // HH:MM 24-hour local NZ time. start < end.
            $table->string('start_time', 5);
            $table->string('end_time', 5);
            // Slot length in minutes — usually 30 or 60.
            $table->unsignedSmallInteger('slot_minutes')->default(30);
            // Optional consultant assignment; null = "any consultant".
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Used to retire a rule without deleting historical references.
            $table->boolean('active')->default(true);
            $table->string('label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('availability_rules');
    }
};
