<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            // 1-5 star rating, captured at submit time, optional so legacy
            // reviews keep working.
            $table->unsignedTinyInteger('rating')->nullable()->after('paragraph');

            // Moderation gate — reviews are NOT publicly visible until an
            // admin flips this to true on the admin Reviews page.
            $table->boolean('is_published')->default(false)->after('status');

            // Curated picks that surface in the "Featured stories" grid on
            // the public immigration page.
            $table->boolean('is_featured')->default(false)->after('is_published');

            // Free-text label admins set during moderation, e.g. "Skilled
            // Migrant", "Student Visa". Used as a chip on each public card.
            $table->string('visa_type')->nullable()->after('is_featured');
        });
    }

    public function down(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropColumn(['rating', 'is_published', 'is_featured', 'visa_type']);
        });
    }
};
