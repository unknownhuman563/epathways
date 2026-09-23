<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * E-signing for accommodation agreements — mirrors the immigration managed
 * agreement flow: a per-agreement bearer token emailed to the client, who opens
 * the link, draws a signature, and the signed PDF is baked with an audit block.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_agreements', function (Blueprint $table) {
            $table->string('signing_token')->nullable()->unique()->after('pdf_path');
            $table->string('signed_pdf_path')->nullable()->after('signing_token');
            $table->string('signer_name')->nullable()->after('signed_pdf_path');
            $table->longText('signature_data')->nullable()->after('signer_name');   // base64 PNG data URL
            $table->string('signer_ip')->nullable()->after('signature_data');
            $table->string('signer_user_agent')->nullable()->after('signer_ip');
            $table->timestamp('viewed_at')->nullable()->after('sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_agreements', function (Blueprint $table) {
            $table->dropColumn(['signing_token', 'signed_pdf_path', 'signer_name', 'signature_data', 'signer_ip', 'signer_user_agent', 'viewed_at']);
        });
    }
};
