<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            // Stable string key — e.g. "resident_intake_fee_cents".
            $table->string('key')->unique();
            // Free-form value; admin UI casts based on `type`.
            $table->text('value')->nullable();
            // int | string | bool | json — determines how the admin UI renders
            // the input and how Setting::get casts on read.
            $table->string('type')->default('string');
            // Optional human label / group used to render the admin page.
            $table->string('label')->nullable();
            $table->string('group')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
