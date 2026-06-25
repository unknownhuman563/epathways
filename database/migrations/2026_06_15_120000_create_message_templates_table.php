<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_templates', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();          // code reference, e.g. 'tracker_welcome'
            $table->string('name');                    // display name for staff
            $table->text('description')->nullable();
            $table->json('channels')->nullable();      // ["email","sms"]
            $table->string('email_subject')->nullable();
            $table->longText('email_body')->nullable();  // markdown
            $table->text('sms_body')->nullable();        // plain text
            $table->json('variables_documented')->nullable(); // [{name, description}]
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_templates');
    }
};
