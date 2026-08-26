<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-department editable email FOOTER text (company/copyright, website,
 * e-mail, WhatsApp, location). Previously hard-coded in
 * resources/views/emails/branded.blade.php; now each department can override
 * it from the Email Branding page. All nullable — a blank field falls back to
 * the global default in EmailBranding::resolveFooter().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_brandings', function (Blueprint $table) {
            // Guarded so a re-run after an interrupted migration can't fail on
            // a column that already exists.
            if (! Schema::hasColumn('email_brandings', 'footer_company')) {
                $table->string('footer_company', 160)->nullable();
            }
            if (! Schema::hasColumn('email_brandings', 'footer_website_label')) {
                $table->string('footer_website_label', 160)->nullable();
            }
            if (! Schema::hasColumn('email_brandings', 'footer_website_url')) {
                $table->string('footer_website_url', 500)->nullable();
            }
            if (! Schema::hasColumn('email_brandings', 'footer_email')) {
                $table->string('footer_email', 191)->nullable();
            }
            if (! Schema::hasColumn('email_brandings', 'footer_whatsapp')) {
                $table->text('footer_whatsapp')->nullable();   // multi-line allowed
            }
            if (! Schema::hasColumn('email_brandings', 'footer_location')) {
                $table->text('footer_location')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('email_brandings', function (Blueprint $table) {
            $table->dropColumn([
                'footer_company', 'footer_website_label', 'footer_website_url',
                'footer_email', 'footer_whatsapp', 'footer_location',
            ]);
        });
    }
};
