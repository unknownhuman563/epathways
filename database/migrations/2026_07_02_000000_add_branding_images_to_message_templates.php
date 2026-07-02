<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            // Optional per-template branding for the email shell. Null = use
            // the default ePathways banner / footer image.
            $table->string('banner_image')->nullable()->after('email_body');
            $table->string('footer_image')->nullable()->after('banner_image');
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn(['banner_image', 'footer_image']);
        });
    }
};
