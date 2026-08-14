<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-department email branding, managed from the admin UI. One row per
 * department ('default' + each portal); each holds an uploaded banner + CTA
 * image. These override the file-based defaults in config/email_branding.php so
 * the team can set a department's email look without touching the server.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_brandings', function (Blueprint $table) {
            $table->id();
            $table->string('department', 30)->unique(); // 'default' | sales | education | …
            $table->string('banner_path')->nullable();  // public-disk path
            $table->string('footer_path')->nullable();   // public-disk path (CTA)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_brandings');
    }
};
