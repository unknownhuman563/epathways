<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Programs UI and controller validation allow a "certificate" category, but
 * the column was created as enum('diplomas','bachelors','masters') — so on
 * strict MySQL (production) saving a Certificate program throws
 * "1265 Data truncated for column 'category'" and 500s. Add 'certificate' to
 * the allowed set. (Kept as the singular 'certificate' to match the value the
 * app already sends and stores.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->enum('category', ['certificate', 'diplomas', 'bachelors', 'masters'])->change();
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->enum('category', ['diplomas', 'bachelors', 'masters'])->change();
        });
    }
};
