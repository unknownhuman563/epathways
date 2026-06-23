<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the timestamp stamped when an applicant reaches the new
 * "post_viewing_followup" onboarding stage (the post-viewing follow-up email
 * step that sits between "viewing_completed" and "pre_tenancy_form_sent").
 * Additive and nullable, so existing rows are unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dateTime('post_viewing_followup_at')->nullable()->after('viewing_outcome');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dropColumn('post_viewing_followup_at');
        });
    }
};
