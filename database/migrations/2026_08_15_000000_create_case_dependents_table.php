<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dependants (children / partner / other) included in a principal applicant's
 * immigration case. They have NO login — the principal manages them from the
 * lead portal, and staff manage them in the case profile. A dependant is a
 * lightweight sub-record tied to the case (leads.id), never a Lead/User itself.
 *
 * Their documents reuse lead_documents via a nullable dependent_id (null = the
 * principal applicant's own documents; set = that dependant's).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_dependents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete(); // the case they're related to
            $table->string('relationship', 30)->default('child'); // child | partner | parent | sibling | other
            $table->string('family_name', 120)->nullable();
            $table->string('first_name', 120)->nullable();
            $table->string('middle_name', 120)->nullable();
            $table->date('dob')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('nationality', 100)->nullable();
            $table->string('passport_number', 60)->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('source', 20)->default('staff'); // staff | portal (who added them)
            $table->string('notes', 500)->nullable();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
        });

        Schema::table('lead_documents', function (Blueprint $table) {
            // null = principal applicant's document; set = that dependant's.
            $table->foreignId('dependent_id')->nullable()->after('lead_id')
                ->constrained('case_dependents')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dependent_id');
        });
        Schema::dropIfExists('case_dependents');
    }
};
