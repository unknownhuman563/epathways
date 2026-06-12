<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Expands the EOI submissions table into a full onboarding pipeline record.
 *
 * Purely ADDITIVE — no existing column is renamed, dropped, or retyped, so the
 * public eoiStore/eoiHotStore endpoints and existing rows keep working. IDs are
 * bigint to match the rest of the schema (the spec's "uuid" is nominal). All new
 * columns are nullable; lead_temperature is backfilled from the existing
 * form_type so legacy rows get the denormalised value.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            // Pipeline tracking
            $table->foreignId('property_id')->nullable()->after('property_interested')
                ->constrained('accommodation_properties')->nullOnDelete();
            $table->string('lead_temperature', 10)->nullable()->after('form_type'); // hot | cold

            // Stage data
            $table->dateTime('viewing_scheduled_at')->nullable();
            $table->dateTime('viewing_completed_at')->nullable();
            $table->text('viewing_outcome')->nullable();
            $table->dateTime('pre_tenancy_form_sent_at')->nullable();
            $table->dateTime('pre_tenancy_form_completed_at')->nullable();
            $table->json('pre_tenancy_form_data')->nullable();
            $table->dateTime('tenancy_agreement_sent_at')->nullable();
            $table->dateTime('tenancy_agreement_signed_at')->nullable();
            $table->decimal('invoice_amount_nzd', 10, 2)->nullable();
            $table->dateTime('invoice_sent_at')->nullable();
            $table->dateTime('payment_confirmed_at')->nullable();
            $table->date('move_in_date')->nullable();
            $table->text('not_proceeding_reason')->nullable();
            $table->text('declined_reason')->nullable();

            // Bridge to Tenants
            $table->foreignId('converted_to_tenant_id')->nullable()
                ->constrained('accommodation_tenants')->nullOnDelete();

            // Staff workflow
            $table->foreignId('assigned_to_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->text('internal_notes')->nullable();

            // Soft deletes
            $table->softDeletes();

            // Indexes for the list/kanban filters (foreignId already indexes
            // property_id / converted_to_tenant_id / assigned_to_user_id).
            $table->index('status');
            $table->index('form_type');
            $table->index('email');
            $table->index('created_at');
            $table->index(['status', 'form_type']);
        });

        // Backfill the denormalised temperature from the existing form_type.
        DB::table('accommodation_eoi_submissions')->update([
            'lead_temperature' => DB::raw('form_type'),
        ]);
    }

    public function down(): void
    {
        Schema::table('accommodation_eoi_submissions', function (Blueprint $table) {
            $table->dropForeign(['property_id']);
            $table->dropForeign(['converted_to_tenant_id']);
            $table->dropForeign(['assigned_to_user_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['form_type']);
            $table->dropIndex(['email']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['status', 'form_type']);
            $table->dropColumn([
                'property_id', 'lead_temperature', 'viewing_scheduled_at', 'viewing_completed_at',
                'viewing_outcome', 'pre_tenancy_form_sent_at', 'pre_tenancy_form_completed_at',
                'pre_tenancy_form_data', 'tenancy_agreement_sent_at', 'tenancy_agreement_signed_at',
                'invoice_amount_nzd', 'invoice_sent_at', 'payment_confirmed_at', 'move_in_date',
                'not_proceeding_reason', 'declined_reason', 'converted_to_tenant_id',
                'assigned_to_user_id', 'internal_notes', 'deleted_at',
            ]);
        });
    }
};
