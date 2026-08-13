<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_education_exps', function (Blueprint $table) {
            // Institution is optional on the free-assessment form (only
            // field_of_study is required), so allow it to be null rather than
            // storing an empty-string placeholder.
            $table->string('institution')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('lead_education_exps', function (Blueprint $table) {
            $table->string('institution')->nullable(false)->change();
        });
    }
};
