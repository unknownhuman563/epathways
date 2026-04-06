<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->date('dob')->nullable()->after('last_name');
            $table->string('other_names')->nullable()->after('dob');
            
            // Residency & Origins
            $table->string('country_of_birth')->nullable()->after('marital_status');
            $table->string('place_of_birth')->nullable()->after('country_of_birth');
            $table->string('citizenship')->nullable()->after('place_of_birth');
            $table->string('residence_city')->nullable()->after('citizenship');
            $table->string('residence_state')->nullable()->after('residence_city');
            $table->string('residence_country')->nullable()->after('residence_state');

            // Passport Details
            $table->string('has_passport')->nullable()->after('residence_country');
            $table->string('passport_number')->nullable()->after('has_passport');
            $table->date('passport_expiry')->nullable()->after('passport_number');
            $table->string('passport_path')->nullable()->after('passport_expiry');

            // Additional Notes
            $table->boolean('terms_accepted')->default(false)->after('passport_path');
            $table->text('gap_explanation')->nullable()->after('terms_accepted');
            $table->text('education_notes')->nullable()->after('gap_explanation');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'dob', 'other_names', 'country_of_birth', 'place_of_birth', 
                'citizenship', 'residence_city', 'residence_state', 'residence_country',
                'has_passport', 'passport_number', 'passport_expiry', 'passport_path',
                'terms_accepted', 'gap_explanation', 'education_notes'
            ]);
        });
    }
};
