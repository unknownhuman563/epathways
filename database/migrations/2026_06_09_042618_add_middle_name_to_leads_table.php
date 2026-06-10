<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // middle_name is a distinct field from other_names (which captures
        // legal aliases / former surnames). Surfaced on the public /track
        // page so leads can self-edit it from the tracking flow.
        Schema::table('leads', function (Blueprint $table) {
            $table->string('middle_name', 80)->nullable()->after('first_name');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('middle_name');
        });
    }
};
