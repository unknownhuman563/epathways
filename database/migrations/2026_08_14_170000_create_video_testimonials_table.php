<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Video testimonials embedded on the landing page (Facebook videos/reels).
 * Managed in the admin; each carries an orientation so mixed landscape/portrait
 * clips render at the right aspect in the carousel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('url');                                 // Facebook video / reel link
            $table->string('orientation', 12)->default('portrait'); // portrait | landscape
            $table->string('caption')->nullable();
            $table->boolean('is_published')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed the first batch supplied by the team (orientation is a starting
        // guess — editable in the admin).
        DB::table('video_testimonials')->insert([
            ['url' => 'https://www.facebook.com/share/v/1Jr94Buykh/', 'orientation' => 'landscape', 'is_published' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['url' => 'https://www.facebook.com/reel/2038090107102570', 'orientation' => 'portrait', 'is_published' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['url' => 'https://www.facebook.com/reel/1669112744514613', 'orientation' => 'portrait', 'is_published' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('video_testimonials');
    }
};
