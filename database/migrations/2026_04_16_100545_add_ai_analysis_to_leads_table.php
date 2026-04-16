<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('ai_analysis')->nullable()->after('declaration_accepted');
            $table->string('ai_analysis_status')->default('pending')->after('ai_analysis');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['ai_analysis', 'ai_analysis_status']);
        });
    }
};
