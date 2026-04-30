<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->text('english_requirements')->nullable()->after('entry_requirements');
            $table->decimal('tuition_fee', 10, 2)->nullable()->after('fee_guide');
            $table->string('tuition_fee_notes')->nullable()->after('tuition_fee');
            $table->string('institution')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn(['english_requirements', 'tuition_fee', 'tuition_fee_notes']);
            $table->string('institution')->nullable(false)->change();
        });
    }
};
