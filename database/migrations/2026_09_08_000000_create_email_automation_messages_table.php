<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// One row per configured message on an automation event. An event can have
// several (e.g. "Payment verified" → a client receipt + an adviser heads-up).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_automation_messages', function (Blueprint $table) {
            $table->id();
            $table->string('event_key', 120)->index();   // e.g. immigration.invoice.paid
            $table->string('recipient', 30);              // client | adviser | manager | team
            $table->string('template_key', 120)->nullable();
            $table->string('channel', 12)->default('email'); // email | sms | both
            $table->unsignedSmallInteger('delay_minutes')->default(0);
            $table->boolean('enabled')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_automation_messages');
    }
};
