<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Public tenant complaints. The submitter gives only their name + email + a
 * message; the system matches the email to a tenant (and their property) so the
 * portal list can show the property without the tenant looking it up.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accommodation_complaints', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->text('message');
            $table->foreignId('tenant_id')->nullable()->constrained('accommodation_tenants')->nullOnDelete();
            $table->foreignId('property_id')->nullable()->constrained('accommodation_properties')->nullOnDelete();
            $table->timestamps();

            $table->index('email');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accommodation_complaints');
    }
};
