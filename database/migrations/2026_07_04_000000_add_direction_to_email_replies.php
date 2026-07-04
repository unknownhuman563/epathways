<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_replies', function (Blueprint $table) {
            // 'inbound' = pulled from the mailbox; 'outbound' = a staff reply
            // sent from the app. Both live in the thread per lead.
            $table->string('direction')->default('inbound')->after('lead_id')->index();
            $table->string('to_email')->nullable()->after('from_name');
            $table->foreignId('sent_by_user_id')->nullable()->after('to_email')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('email_replies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sent_by_user_id');
            $table->dropColumn(['direction', 'to_email']);
        });
    }
};
