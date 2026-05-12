<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            $table->string('nzqa_iqa_reference')->nullable()->after('nzqa_status');
            $table->string('english_test_score')->nullable()->after('english_evidence');
            $table->date('english_test_date')->nullable()->after('english_test_score');
        });
    }

    public function down(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            $table->dropColumn(['nzqa_iqa_reference', 'english_test_score', 'english_test_date']);
        });
    }
};
