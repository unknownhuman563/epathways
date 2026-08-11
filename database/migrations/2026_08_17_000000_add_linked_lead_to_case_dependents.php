<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Link a dependant to the child's OWN case (Lead). When set, the parent's Family
 * view reads the child's real case checklist + submitted documents through this
 * link — so documents the child submits on their case are visible to the parent.
 * Null = a standalone sub-record (no linked case), as before.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->foreignId('linked_lead_id')->nullable()->after('lead_id')
                ->constrained('leads')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('linked_lead_id');
        });
    }
};
