<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Convert to Student" — minimal first cut. A boolean flag plus who/when
 * audit so we can move a lead into Education's student queue without
 * spawning a separate Student table. The lead record stays the same record;
 * all documents/notes/tasks/history continue to live on it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('is_student')->default(false)->after('status');
            $table->timestamp('student_converted_at')->nullable()->after('is_student');
            $table->unsignedBigInteger('student_converted_by')->nullable()->after('student_converted_at');
            $table->index('is_student');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['is_student']);
            $table->dropColumn(['is_student', 'student_converted_at', 'student_converted_by']);
        });
    }
};
