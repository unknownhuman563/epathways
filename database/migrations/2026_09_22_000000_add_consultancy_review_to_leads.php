<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Consultancy Agreement Verification — mirrors the proposal verification pair
 * (proposal_review + proposed_program_meta) for consultancy agreements:
 *
 *  - consultancy_review : the review workflow envelope (status pending/verified/
 *    approved, who/when, the chosen scenario + ordered fee-item keys, and a
 *    changes_requested block).
 *  - consultancy_meta   : per fee-item overrides + a note thread, keyed by the
 *    item key (school_enrolment / english_proficiency / inz_voucher / package).
 *
 * JSON columns are exempt from InnoDB's in-row size limit, so these are safe to
 * add to the wide `leads` table (see CLAUDE.md).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('consultancy_review')->nullable()->after('proposal_review');
            $table->json('consultancy_meta')->nullable()->after('consultancy_review');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['consultancy_review', 'consultancy_meta']);
        });
    }
};
