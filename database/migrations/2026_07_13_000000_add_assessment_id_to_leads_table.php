<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links an immigration case back to the exact Assessment it was converted
 * from. Previously the case⇄assessment join was inferred by matching
 * applicant email, which returns the wrong record when two applicants share
 * an email (e.g. a parent registering several people) — the case profile
 * then showed a different person's intake. This FK removes the ambiguity.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('assessment_id')->nullable()->after('is_immigration_case')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assessment_id');
        });
    }
};
