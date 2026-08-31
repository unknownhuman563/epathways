<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_agreements', function (Blueprint $table) {
            // Agent e-signature (same shape as the tracker Agreement signing:
            // typed legal name + base64 PNG data URL + audit trail). Null until
            // the agent signs from their portal.
            $table->string('agent_signer_name')->nullable()->after('fields');
            $table->longText('agent_signature_data')->nullable()->after('agent_signer_name');
            $table->timestamp('agent_signed_at')->nullable()->after('agent_signature_data');
            $table->string('agent_signed_ip', 45)->nullable()->after('agent_signed_at');
            $table->string('agent_signed_user_agent')->nullable()->after('agent_signed_ip');
        });
    }

    public function down(): void
    {
        Schema::table('agent_agreements', function (Blueprint $table) {
            $table->dropColumn([
                'agent_signer_name', 'agent_signature_data', 'agent_signed_at',
                'agent_signed_ip', 'agent_signed_user_agent',
            ]);
        });
    }
};
