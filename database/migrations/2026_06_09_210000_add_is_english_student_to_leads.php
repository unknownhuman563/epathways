<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * English-team conversion flag. Mirrors the existing is_student /
 * is_immigration_case / is_accommodation_client trio so the English
 * team can claim leads from the Sales pipeline with the same audit
 * trail (who converted, when), and so the leads-table query can hide
 * a lead the moment any department adopts it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('is_english_student')->default(false)->after('is_accommodation_client');
            $table->timestamp('english_converted_at')->nullable()->after('is_english_student');
            $table->foreignId('english_converted_by')->nullable()->after('english_converted_at')
                ->constrained('users')->nullOnDelete();
            $table->index('is_english_student');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['is_english_student']);
            $table->dropForeign(['english_converted_by']);
            $table->dropColumn(['is_english_student', 'english_converted_at', 'english_converted_by']);
        });
    }
};
