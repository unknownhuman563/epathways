<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A dependant's document checklist is driven by the VISA assigned to them (the
 * same catalogue cases use), not a hardcoded per-relationship list. Staff set
 * this visa on the dependant; the parent only adds the family member. Null =
 * no visa set yet (the checklist shows an "adviser will set your visa" state).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->foreignId('visa_type_id')->nullable()->after('relationship')
                ->constrained('visa_types')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('visa_type_id');
        });
    }
};
