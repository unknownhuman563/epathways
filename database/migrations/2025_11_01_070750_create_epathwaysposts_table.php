<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('epathwaysposts', function (Blueprint $table) {
            $table->id();
            $table->string('ancmnts_title');
            $table->string('ancmnts_content');
            $table->text('ancmnts_image');
            $table->integer('ancmnts_size');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epathwaysposts');
    }
};
