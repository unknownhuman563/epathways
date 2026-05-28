<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            // Optional headshot — stored at storage/app/public/user-reviews/photos.
            // Surfaced as photo_url on the public payload.
            $table->string('photo_path')->nullable()->after('department');
        });
    }

    public function down(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });
    }
};
