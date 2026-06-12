<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds internal property-management fields onto the existing listing table.
 *
 * The original columns power the PUBLIC /accommodation listings; everything
 * added here is department-only operational data (Mercury accounts, door codes,
 * bonds, PM contacts, utility due dates, gas tracking, occupancy). All columns
 * are nullable so existing public listings keep working untouched, and the
 * Property model marks them $hidden so they never leak into public page props.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            // Identification
            $table->string('code', 50)->nullable()->unique()->after('id');
            $table->string('address', 200)->nullable()->after('name');
            $table->string('city', 100)->nullable()->after('address');
            $table->string('region', 100)->nullable()->after('city');
            $table->string('property_type', 30)->nullable()->after('region'); // House | Apartment | Townhouse | Studio | Room
            $table->unsignedInteger('total_rooms')->nullable()->after('property_type');

            // Utilities & codes
            $table->string('mercury_account_number', 100)->nullable();
            $table->string('mercury_account_holder', 255)->nullable();
            $table->string('property_icp', 100)->nullable();
            $table->string('house_code', 100)->nullable();
            $table->string('internet_passcode', 100)->nullable();

            // Financial
            $table->decimal('bond_total_nzd', 10, 2)->nullable();
            $table->decimal('advance_total_nzd', 10, 2)->nullable();

            // External property manager (not Exalt staff)
            $table->string('property_manager_name', 255)->nullable();
            $table->string('property_manager_phone', 50)->nullable();
            $table->string('property_manager_email', 255)->nullable();

            // Operational
            $table->string('pm_payment_schedule', 50)->nullable();
            $table->date('power_due_date')->nullable();
            $table->date('water_due_date')->nullable();
            $table->date('internet_due_date')->nullable();
            $table->date('last_gas_purchase')->nullable();
            $table->boolean('uses_bottled_gas')->default(false);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('accommodation_properties', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn([
                'code', 'address', 'city', 'region', 'property_type', 'total_rooms',
                'mercury_account_number', 'mercury_account_holder', 'property_icp',
                'house_code', 'internet_passcode', 'bond_total_nzd', 'advance_total_nzd',
                'property_manager_name', 'property_manager_phone', 'property_manager_email',
                'pm_payment_schedule', 'power_due_date', 'water_due_date', 'internet_due_date',
                'last_gas_purchase', 'uses_bottled_gas', 'is_active', 'notes',
            ]);
        });
    }
};
