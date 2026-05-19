<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two tables for the Lead Portal document workflow:
 *
 *   lead_document_requests  — what staff have asked the lead to provide
 *                             (e.g. "Passport bio page", "IELTS score report")
 *   lead_documents          — files the lead (or staff) has uploaded.
 *                             A document may be tied to a request (the lead
 *                             responded) or unsolicited (lead uploaded extra,
 *                             or staff shared an offer letter etc.)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();

            $table->string('label', 120);                   // "Passport bio page"
            $table->string('description', 500)->nullable(); // free-text note from staff
            $table->boolean('required')->default(true);     // optional vs mandatory

            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('requested_at')->nullable();

            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
        });

        Schema::create('lead_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('request_id')->nullable()->constrained('lead_document_requests')->nullOnDelete();

            // Upload metadata
            $table->string('original_name', 255);
            $table->string('file_path');                    // storage/app/private/lead-documents/...
            $table->string('mime', 120)->nullable();
            $table->unsignedInteger('size')->nullable();    // bytes

            // Review state
            //   Submitted    — lead uploaded; awaiting review
            //   UnderReview  — staff opened it; not yet decided
            //   Approved     — staff accepted
            //   Rejected     — staff rejected; reason in `note`; lead may re-upload
            //   StaffShared  — file pushed BY staff TO lead (e.g. offer letter); not subject to review
            $table->string('status', 20)->default('Submitted');
            $table->string('note', 500)->nullable();

            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->index(['lead_id', 'status']);
            $table->index('request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_documents');
        Schema::dropIfExists('lead_document_requests');
    }
};
