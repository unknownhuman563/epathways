<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tenants attached to a managed property. IDs are bigint to match the existing
 * accommodation_properties table (which uses auto-increment ids, not uuids).
 * passport_number is stored encrypted, so it is a TEXT column (ciphertext far
 * exceeds the plaintext length).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_tenants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('property_id')
                ->constrained('accommodation_properties')
                ->restrictOnDelete();

            $table->string('unit', 50)->nullable();

            // Identity
            $table->string('first_name', 100);
            $table->string('family_name', 100);
            $table->string('display_name_override', 200)->nullable();
            $table->string('email', 200)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('whatsapp', 50)->nullable();
            $table->string('nationality', 100)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->text('passport_number')->nullable(); // encrypted at rest

            // Contract
            $table->date('contract_start')->nullable();
            $table->date('contract_end')->nullable();
            $table->string('contract_type', 30)->default('not_yet_defined'); // fixed_term | periodic | open | not_yet_defined
            $table->unsignedInteger('open_contract_notice_weeks')->nullable();

            // Financial
            $table->decimal('bond_paid_nzd', 10, 2)->nullable();
            $table->decimal('advance_paid_nzd', 10, 2)->nullable();
            $table->decimal('weekly_rent_nzd', 10, 2)->nullable();
            $table->decimal('weekly_utilities_nzd', 10, 2)->nullable();

            // Document checklist (mirrors files held in the shared Drive)
            $table->boolean('has_passport_in_drive')->default(false);
            $table->boolean('has_tenancy_agreement_in_drive')->default(false);
            $table->boolean('has_inspection_report_in_drive')->default(false);

            // Lifecycle
            $table->string('current_status', 30)->default('active'); // active | notice_given | vacating | vacated | breached
            $table->unsignedBigInteger('converted_from_viewer_id')->nullable(); // FK placeholder (no viewers table yet)
            $table->foreignId('moved_to_property_id')->nullable()
                ->constrained('accommodation_properties')
                ->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
            $table->dateTime('ended_at')->nullable();

            $table->index('current_status');
            $table->index('contract_end');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_tenants');
    }
};
