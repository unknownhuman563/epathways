<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_logs', function (Blueprint $table) {
            $table->id();
            $table->string('template_key')->nullable();         // null for raw sends
            $table->string('channel', 10);                       // email | sms
            $table->string('recipient_type', 20)->default('lead'); // lead | user | raw
            $table->unsignedBigInteger('recipient_id')->nullable();
            $table->string('recipient_address');                 // actual email/phone
            $table->string('subject')->nullable();
            $table->text('body')->nullable();                    // final rendered body
            $table->string('status', 12)->default('queued');     // queued | sent | failed | bounced
            $table->string('provider_message_id')->nullable();   // Twilio SID / mail id
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->foreignId('triggered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['recipient_type', 'recipient_id']);
            $table->index(['channel', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_logs');
    }
};
