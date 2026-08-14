<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Let a department turn OFF its banner and/or CTA entirely (distinct from
 * "use the default"). When hidden, the email renders no banner / no CTA image.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('email_brandings', function (Blueprint $table) {
            $table->boolean('hide_banner')->default(false)->after('call_number');
            $table->boolean('hide_footer')->default(false)->after('hide_banner');
        });
    }

    public function down(): void
    {
        Schema::table('email_brandings', function (Blueprint $table) {
            $table->dropColumn(['hide_banner', 'hide_footer']);
        });
    }
};
