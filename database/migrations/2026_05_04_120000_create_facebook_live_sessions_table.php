<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facebook_live_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('fb_link', 500);
            $table->string('image')->nullable();
            $table->date('session_date');
            $table->boolean('is_featured')->default(false);
            $table->timestamps();

            $table->index('session_date');
            $table->index('is_featured');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facebook_live_sessions');
    }
};
