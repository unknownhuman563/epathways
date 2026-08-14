<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Let reviews come from more than the on-site form. `source` distinguishes an
 * on-site submission from a Google Business Profile review; `external_id` keeps
 * a Google sync idempotent (one row per Google review); `external_photo_url`
 * holds Google's author avatar (we don't re-host it); `review_date` is the
 * review's real date so "2 months ago" reflects Google, not our import time.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->string('source', 20)->default('onsite')->index()->after('department');
            $table->string('external_id', 191)->nullable()->after('source');
            $table->string('external_photo_url', 1024)->nullable()->after('external_id');
            $table->timestamp('review_date')->nullable()->after('external_photo_url');

            // One row per Google review. Multiple NULLs are allowed under a
            // unique index in MySQL, so on-site rows (external_id NULL) are fine.
            $table->unique(['source', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropUnique(['source', 'external_id']);
            $table->dropColumn(['source', 'external_id', 'external_photo_url', 'review_date']);
        });
    }
};
