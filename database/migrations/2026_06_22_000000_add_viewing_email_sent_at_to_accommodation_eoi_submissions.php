<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the timestamp stamped when an applicant reaches the new
 * "viewing_email_sent" onboarding stage (the viewing-booking email step that
 * sits between "shortlisted" and "viewing_booked"). Additive and nullable, so
 * existing rows are unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dateTime('viewing_email_sent_at')->nullable()->after('property_id');
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dropColumn('viewing_email_sent_at');
        });
    }
};
