<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sales-dashboard summary columns: when the lead has a calendar booking
 * date, and per-lead Heyflow links the team pastes into the dashboard
 * sheet (client information form, call-update form). Surfaced in the
 * leads index so the table mirrors the dashboard sheet 1:1.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->date('calendar_date')->nullable()->after('date_of_engagement');
            $table->string('client_info_link', 500)->nullable()->after('calendar_date');
            $table->string('call_update_form_link', 500)->nullable()->after('client_info_link');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['calendar_date', 'client_info_link', 'call_update_form_link']);
        });
    }
};
