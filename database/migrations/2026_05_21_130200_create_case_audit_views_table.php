<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Privacy Act 2020 audit log — records every immigration-case view by an
 * adviser/staff member. Required for licensed-adviser compliance: if a
 * client requests "who has looked at my file?", we need to answer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_audit_views', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lead_id')->index();
            $table->unsignedBigInteger('viewer_id')->index();
            $table->string('viewer_name', 120)->nullable();
            $table->string('viewer_role', 60)->nullable();
            $table->string('action', 60)->default('view'); // view | edit | download
            $table->string('context', 120)->nullable();    // e.g. "documents tab", "edit"
            $table->ipAddress('ip')->nullable();
            $table->timestamp('viewed_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_audit_views');
    }
};
