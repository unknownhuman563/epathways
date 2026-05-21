<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * First-touch marketing attribution. UTM values are captured by
 * LeadIntakeService when a Lead is first created and never overwritten on
 * resubmit — that's the whole point of "first-touch" attribution. Nullable
 * so legacy leads stay valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('utm_source', 120)->nullable()->after('source');
            $table->string('utm_medium', 120)->nullable()->after('utm_source');
            $table->string('utm_campaign', 120)->nullable()->after('utm_medium');
            $table->string('utm_content', 120)->nullable()->after('utm_campaign');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']);
        });
    }
};
