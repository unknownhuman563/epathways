<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `source` embeds the event code for event registrations
 * (event:{event_code}); a long event slug overflowed the old varchar(60) and
 * broke registration. Widen it (and keep the index) so long slugs fit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('source', 191)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('source', 60)->nullable()->change();
        });
    }
};
