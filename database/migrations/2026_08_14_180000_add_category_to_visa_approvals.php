<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Split the Visa Approved showcase by category: 'student' (the existing "Visa
 * Approved Milestones") and 'artist' ("Artists We've Helped Bring to NZ").
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_approvals', function (Blueprint $table) {
            $table->string('category', 20)->default('student')->index()->after('country');
        });
    }

    public function down(): void
    {
        Schema::table('visa_approvals', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
