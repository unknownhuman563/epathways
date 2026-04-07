<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // New section JSON columns
            $table->json('immigration_info')->nullable()->after('education_notes');
            $table->json('character_info')->nullable()->after('immigration_info');
            $table->json('health_info')->nullable()->after('character_info');
            $table->json('family_info')->nullable()->after('health_info');
            $table->json('nz_contacts_info')->nullable()->after('family_info');
            $table->json('military_info')->nullable()->after('nz_contacts_info');
            $table->json('source_of_funds_info')->nullable()->after('military_info');
            $table->json('home_ties_info')->nullable()->after('source_of_funds_info');
            $table->boolean('declaration_accepted')->default(false)->after('home_ties_info');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'immigration_info',
                'character_info',
                'health_info',
                'family_info',
                'nz_contacts_info',
                'military_info',
                'source_of_funds_info',
                'home_ties_info',
                'declaration_accepted',
            ]);
        });
    }
};
