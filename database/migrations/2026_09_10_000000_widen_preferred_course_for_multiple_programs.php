<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The student add/edit modal now allows selecting multiple programs, stored as
 * a " · "-joined string in lead_study_plans.preferred_course. Widen the column
 * from varchar(200) so several titles fit.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('lead_study_plans', 'preferred_course')) {
            Schema::table('lead_study_plans', function (Blueprint $table) {
                $table->string('preferred_course', 1000)->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('lead_study_plans', 'preferred_course')) {
            Schema::table('lead_study_plans', function (Blueprint $table) {
                $table->string('preferred_course', 200)->nullable()->change();
            });
        }
    }
};
