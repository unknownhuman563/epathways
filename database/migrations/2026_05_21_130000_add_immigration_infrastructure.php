<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Immigration infrastructure — four features in one migration:
 *   1. Multi-service flags on leads (immigration / accommodation) mirroring is_student.
 *   2. INZ lodgement tracking on leads.
 *   3. IAA licence fields on users (NZ legal requirement).
 *   4. Services-agreement timestamp on leads (NZ legal gating).
 *
 * Visa types and per-case audit-views ship as their own tables (separate
 * migrations for cleanliness).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Multi-service flags — same pattern as is_student.
            $table->boolean('is_immigration_case')->default(false)->after('is_student');
            $table->timestamp('immigration_converted_at')->nullable()->after('is_immigration_case');
            $table->unsignedBigInteger('immigration_converted_by')->nullable()->after('immigration_converted_at');

            $table->boolean('is_accommodation_client')->default(false)->after('immigration_converted_by');
            $table->timestamp('accommodation_converted_at')->nullable()->after('is_accommodation_client');
            $table->unsignedBigInteger('accommodation_converted_by')->nullable()->after('accommodation_converted_at');

            // INZ lodgement tracking.
            $table->string('inz_visa_type', 120)->nullable()->after('accommodation_converted_by');
            $table->timestamp('inz_lodged_at')->nullable()->after('inz_visa_type');
            $table->string('inz_reference', 60)->nullable()->after('inz_lodged_at');
            $table->string('inz_status', 60)->nullable()->after('inz_reference'); // Lodged | Info Requested | Decision Pending | Approved | Declined | Withdrawn
            $table->timestamp('inz_decision_at')->nullable()->after('inz_status');

            // Services agreement — IAA / Privacy Act gating: cannot give
            // advice before a written agreement is in place.
            $table->timestamp('services_agreement_signed_at')->nullable()->after('inz_decision_at');

            // Indexes for the dashboard queries.
            $table->index('is_immigration_case');
            $table->index('is_accommodation_client');
            $table->index('inz_status');
        });

        // 3. IAA licence on users — NZ-licensed advisers must surface this.
        Schema::table('users', function (Blueprint $table) {
            $table->string('iaa_licence_number', 60)->nullable()->after('role');
            $table->date('iaa_licence_expiry')->nullable()->after('iaa_licence_number');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['is_immigration_case']);
            $table->dropIndex(['is_accommodation_client']);
            $table->dropIndex(['inz_status']);
            $table->dropColumn([
                'is_immigration_case', 'immigration_converted_at', 'immigration_converted_by',
                'is_accommodation_client', 'accommodation_converted_at', 'accommodation_converted_by',
                'inz_visa_type', 'inz_lodged_at', 'inz_reference', 'inz_status', 'inz_decision_at',
                'services_agreement_signed_at',
            ]);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['iaa_licence_number', 'iaa_licence_expiry']);
        });
    }
};
