<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two per-template email options:
 *  - branding: which portal's banner + CTA preset the email shell uses
 *    (config/email_branding.php). Null = default ePathways artwork.
 *  - cc / bcc: comma-separated addresses copied on every send of the template
 *    (e.g. the sending team gets a copy).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->string('branding', 30)->nullable()->after('footer_image');
            $table->text('cc')->nullable()->after('branding');
            $table->text('bcc')->nullable()->after('cc');
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn(['branding', 'cc', 'bcc']);
        });
    }
};
