<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop two unused 2025-era tables (0 rows, no model/controller usage):
 *  - ep_announcements  : empty shell (id + timestamps only)
 *  - epathwaysposts    : ancmnts_* columns, never wired to anything
 *
 * down() rebuilds them with their original schema for reversibility.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('ep_announcements');
        Schema::dropIfExists('epathwaysposts');
    }

    public function down(): void
    {
        if (! Schema::hasTable('ep_announcements')) {
            Schema::create('ep_announcements', function (Blueprint $table) {
                $table->id();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('epathwaysposts')) {
            Schema::create('epathwaysposts', function (Blueprint $table) {
                $table->id();
                $table->string('ancmnts_title');
                $table->string('ancmnts_content');
                $table->text('ancmnts_image');
                $table->integer('ancmnts_size');
                $table->timestamps();
            });
        }
    }
};
