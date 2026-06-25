<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Chat & message format library — staff save reusable message titles plus a
 * link or a pasteable template body, with optional notes, so the whole team can
 * find them quickly.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_message_templates', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content'); // a link (Google Doc/Drive) or a template message body
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_message_templates');
    }
};
