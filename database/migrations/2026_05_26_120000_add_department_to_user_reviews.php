<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            // 'immigration' or 'education'. Existing rows backfilled to
            // 'immigration' below since that's where reviews lived before.
            $table->string('department', 20)->default('immigration')->after('visa_type');
            $table->index('department');
        });

        // Belt-and-braces — every existing row gets the immigration label.
        DB::table('user_reviews')->whereNull('department')->update(['department' => 'immigration']);
    }

    public function down(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropIndex(['department']);
            $table->dropColumn('department');
        });
    }
};
