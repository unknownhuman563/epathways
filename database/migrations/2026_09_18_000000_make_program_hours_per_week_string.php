<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widen programs.hours_per_week from an unsignedTinyInteger to a short string so
 * it can hold either a number ("25") or a word ("Unlimited"). Existing integer
 * values convert to their string form automatically.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->string('hours_per_week', 50)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->unsignedTinyInteger('hours_per_week')->nullable()->change();
        });
    }
};
