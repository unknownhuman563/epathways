<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Expand dtr_leaves into the full "Application for Leave" form — employee
 * details, declaration + signature (Sections 1–4) and the manager assessment
 * & approval block (Section 5). Signatures are stored as PNG data URIs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dtr_leaves', function (Blueprint $table) {
            // Section 1 — Employee details
            $table->string('full_name')->nullable()->after('user_id');
            $table->string('position')->nullable()->after('full_name');

            // Section 2 — Type of leave ("type" already exists) + Other specify
            $table->string('other_specify')->nullable()->after('type');

            // Section 3 — Period & details ("start_date"/"end_date"/"reason" exist)
            $table->date('return_date')->nullable()->after('end_date');
            $table->decimal('total_days', 4, 1)->nullable()->after('return_date');
            $table->string('half_day', 8)->nullable()->after('total_days'); // AM / PM / N/A

            // Section 4 — Employee declaration + signature
            $table->boolean('declaration')->default(false)->after('reason');
            $table->longText('employee_signature')->nullable()->after('declaration');
            $table->timestamp('employee_signed_at')->nullable()->after('employee_signature');

            // Section 5 — Manager assessment & approval
            $table->string('decision')->nullable()->after('status'); // Approved / Approved in part / Declined / Deferred
            $table->string('working_days_approved')->nullable()->after('decision');
            $table->string('operational_impact', 16)->nullable()->after('working_days_approved'); // Low / Medium / High
            $table->text('manager_comments')->nullable()->after('operational_impact');
            $table->longText('manager_signature')->nullable()->after('manager_comments');
            $table->timestamp('manager_signed_at')->nullable()->after('manager_signature');
        });
    }

    public function down(): void
    {
        Schema::table('dtr_leaves', function (Blueprint $table) {
            $table->dropColumn([
                'full_name', 'position', 'other_specify', 'return_date', 'total_days',
                'half_day', 'declaration', 'employee_signature', 'employee_signed_at',
                'decision', 'working_days_approved', 'operational_impact',
                'manager_comments', 'manager_signature', 'manager_signed_at',
            ]);
        });
    }
};
