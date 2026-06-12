<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff-added custom calendar events. Viewings and contract-ends are derived
 * live from their source tables by the aggregator — only bespoke events are
 * stored here. IDs are bigint to match the rest of the schema.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable(); // null = all-day / no end specified
            $table->boolean('is_all_day')->default(false);
            $table->string('location', 300)->nullable();
            $table->foreignId('property_id')->nullable()
                ->constrained('accommodation_properties')->nullOnDelete();
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->string('color_hex', 7)->nullable();        // e.g. #6B7280
            $table->string('recurrence_rule')->nullable();      // RFC 5545 RRULE — future use
            $table->timestamps();
            $table->softDeletes();

            $table->index('starts_at'); // date-range queries (property_id + creator auto-indexed)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_calendar_events');
    }
};
