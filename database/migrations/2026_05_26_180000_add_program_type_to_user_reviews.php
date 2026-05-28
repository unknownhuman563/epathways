<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            // Mirror of visa_type for the education side. Lets a single
            // review that touched both departments record both the visa
            // category (visa_type) AND the programme level (program_type)
            // independently — both nullable, both optional in the form.
            $table->string('program_type', 120)->nullable()->after('visa_type');
        });
    }

    public function down(): void
    {
        Schema::table('user_reviews', function (Blueprint $table) {
            $table->dropColumn('program_type');
        });
    }
};
