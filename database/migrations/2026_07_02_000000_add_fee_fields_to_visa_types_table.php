<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the "Visas" fee breakdown fields surfaced in the immigration
 * portal's add/edit form:
 *   - visa_type          — classification dropdown (e.g. "Fee Paying")
 *   - professional_fees  — ePathways' own professional fee (NZD)
 *   - inz_application_fee — the INZ application fee component (NZD)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->string('visa_type', 60)->nullable()->after('category');
            $table->decimal('professional_fees', 10, 2)->nullable()->after('consultation_price_nzd');
            $table->decimal('inz_application_fee', 10, 2)->nullable()->after('professional_fees');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn(['visa_type', 'professional_fees', 'inz_application_fee']);
        });
    }
};
