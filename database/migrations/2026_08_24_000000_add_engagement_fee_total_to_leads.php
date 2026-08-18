<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The (ex-GST) professional fee the engagement pack was generated at — stored so
 * the Generated Documents table can show a "total amount" per engagement without
 * re-deriving it from the visa's fee schedule (which may have changed).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->decimal('engagement_fee_total', 12, 2)->nullable()->after('engagement_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('engagement_fee_total');
        });
    }
};
