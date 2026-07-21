<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Client e-signing for generated engagement documents (the Written
 * Agreement). Captures the applicant's signature + who/when, and the
 * adviser that generated it so the signed PDF can be re-rendered faithfully.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->unsignedBigInteger('engagement_signer_id')->nullable()->after('source_variant');
            $table->string('client_signature_path')->nullable()->after('engagement_signer_id');
            $table->timestamp('client_signed_at')->nullable()->after('client_signature_path');
            $table->string('client_signer_name')->nullable()->after('client_signed_at');
            $table->string('client_signer_ip')->nullable()->after('client_signer_name');
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropColumn([
                'engagement_signer_id',
                'client_signature_path',
                'client_signed_at',
                'client_signer_name',
                'client_signer_ip',
            ]);
        });
    }
};
