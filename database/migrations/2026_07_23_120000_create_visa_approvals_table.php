<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marketing content — one row per visa approval to showcase on the
 * home-page carousel + the /visa-approved gallery. Admins across
 * super_admin / admin / immigration / sales / education can create,
 * edit and unpublish records.
 *
 * `lead_id` is nullable — the person picker on the admin form lets
 * staff pick an existing Lead (which also covers Cases + Students
 * since those are just flagged Lead rows) OR type a free-form name
 * for someone who isn't in the CRM. `display_name` is always populated
 * so the public UI never has to join.
 *
 * `approved_at` is stored as the first of the approval month (day
 * always = 01) so month + year filters work cleanly without a
 * separate string column.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visa_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('display_name'); // free-form OR mirror of lead's name
            $table->string('country', 100)->nullable(); // origin country
            $table->date('approved_at')->nullable(); // 1st of the month
            $table->string('image_path')->nullable(); // storage/app/public/visa-approvals/...
            $table->text('caption')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_published')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_published', 'approved_at']);
            $table->index('is_featured');
            $table->index('country');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visa_approvals');
    }
};
