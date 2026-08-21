<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Some cases have family tied to them but only a subset belong on the written
// agreement / invoice. This per-dependant flag (default on) lets staff choose
// who is included when the engagement pack is generated.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->boolean('in_agreement')->default(true)->after('relationship');
        });
    }

    public function down(): void
    {
        Schema::table('case_dependents', function (Blueprint $table) {
            $table->dropColumn('in_agreement');
        });
    }
};
