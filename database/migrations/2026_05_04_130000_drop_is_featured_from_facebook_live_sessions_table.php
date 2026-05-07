<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('facebook_live_sessions', function (Blueprint $table) {
            $table->dropIndex(['is_featured']);
            $table->dropColumn('is_featured');
        });
    }

    public function down(): void
    {
        Schema::table('facebook_live_sessions', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false);
            $table->index('is_featured');
        });
    }
};
