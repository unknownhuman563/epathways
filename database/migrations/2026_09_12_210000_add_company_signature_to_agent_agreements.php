<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_agreements', function (Blueprint $table) {
            // ePathways (company) e-signature — the staff member signs the
            // "For ePathways" side, same draw/upload capture as the agent.
            // Null until signed. Falls back to the staff signature-on-file.
            $table->string('company_signer_name')->nullable()->after('agent_signed_user_agent');
            $table->longText('company_signature_data')->nullable()->after('company_signer_name');
            $table->timestamp('company_signed_at')->nullable()->after('company_signature_data');
            $table->foreignId('company_signed_by')->nullable()->after('company_signed_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('agent_agreements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_signed_by');
            $table->dropColumn(['company_signer_name', 'company_signature_data', 'company_signed_at']);
        });
    }
};
