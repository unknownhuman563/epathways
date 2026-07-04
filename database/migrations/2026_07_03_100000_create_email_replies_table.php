<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_replies', function (Blueprint $table) {
            $table->id();
            // Matched lead (by sender email); nullable when no lead matches.
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('from_email')->index();
            $table->string('from_name')->nullable();
            $table->string('subject')->nullable();
            $table->longText('body_text')->nullable();
            $table->longText('body_html')->nullable();
            // IMAP Message-ID — dedup so re-polling never stores the same reply twice.
            $table->string('message_id')->nullable()->unique();
            $table->string('in_reply_to')->nullable();
            $table->timestamp('received_at')->nullable()->index();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_replies');
    }
};
