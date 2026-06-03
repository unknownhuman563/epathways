<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_properties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->string('room_type')->default('single');     // single | ensuite
            $table->boolean('has_wardrobe')->default(false);
            $table->string('bed_type')->default('single');      // single | double
            $table->string('bathroom_type')->default('shared'); // shared | private
            $table->text('includes')->nullable();
            $table->decimal('rent_single', 8, 2);
            $table->decimal('rent_couple', 8, 2)->nullable();
            $table->boolean('bills_excluded')->default(true);
            $table->text('description')->nullable();
            $table->string('status')->default('available');     // available | unavailable
            $table->timestamps();
        });

        Schema::create('accommodation_property_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')
                ->constrained('accommodation_properties')
                ->cascadeOnDelete();
            $table->string('path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_property_images');
        Schema::dropIfExists('accommodation_properties');
    }
};
