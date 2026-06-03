<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->string('short_description', 220)->nullable()->after('name');
            $table->decimal('consultation_price_nzd', 8, 2)->default(250.00)->after('category');
            $table->unsignedSmallInteger('consultation_duration_minutes')->default(30)->after('consultation_price_nzd');
            $table->unsignedSmallInteger('estimated_minutes')->default(15)->after('consultation_duration_minutes');
            $table->string('icon', 60)->nullable()->after('estimated_minutes');
            // Soft-delete so visa types referenced by historical assessments
            // stick around for audit/history even after staff retire them.
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn([
                'short_description',
                'consultation_price_nzd',
                'consultation_duration_minutes',
                'estimated_minutes',
                'icon',
            ]);
        });
    }
};
