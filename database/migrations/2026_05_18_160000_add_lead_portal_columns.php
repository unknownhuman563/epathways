<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wires the Lead Portal:
 *   - users.lead_id → leads.id  (lead-role users link to their CRM record)
 *   - leads.portal_invitation_* columns track the two-step gate
 *     (sales requests → admin approves → invitation email sent).
 *
 * No data migration needed — both columns default to null/none.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // For role='lead' users, links back to the lead record they own.
            // Null for staff users.
            $table->foreignId('lead_id')->nullable()->after('role')
                ->constrained('leads')->nullOnDelete();
        });

        Schema::table('leads', function (Blueprint $table) {
            // Invitation lifecycle:
            //   none       — never requested
            //   pending    — sales requested, awaiting admin approval
            //   sent       — admin approved, email dispatched, awaiting accept
            //   accepted   — lead set password, User row exists, portal active
            //   revoked    — admin revoked access; User row may still exist but cannot log in
            $table->string('portal_invitation_status', 20)->default('none')->after('source');

            // Audit trail for the two-step gate
            $table->foreignId('portal_invitation_requested_by')->nullable()->after('portal_invitation_status')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('portal_invitation_requested_at')->nullable()
                ->after('portal_invitation_requested_by');

            $table->foreignId('portal_invitation_approved_by')->nullable()
                ->after('portal_invitation_requested_at')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('portal_invitation_approved_at')->nullable()
                ->after('portal_invitation_approved_by');

            // Hashed token for the signed setup URL — single-use, expires
            $table->string('portal_invitation_token', 64)->nullable()
                ->after('portal_invitation_approved_at');
            $table->timestamp('portal_invitation_expires_at')->nullable()
                ->after('portal_invitation_token');
            $table->timestamp('portal_invitation_accepted_at')->nullable()
                ->after('portal_invitation_expires_at');

            $table->index('portal_invitation_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['lead_id']);
            $table->dropColumn('lead_id');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['portal_invitation_requested_by']);
            $table->dropForeign(['portal_invitation_approved_by']);
            $table->dropColumn([
                'portal_invitation_status',
                'portal_invitation_requested_by',
                'portal_invitation_requested_at',
                'portal_invitation_approved_by',
                'portal_invitation_approved_at',
                'portal_invitation_token',
                'portal_invitation_expires_at',
                'portal_invitation_accepted_at',
            ]);
        });
    }
};
