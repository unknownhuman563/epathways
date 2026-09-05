<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds structured Contact / Portal / Agreement fields to schools, so the info
 * that used to be pasted into the free-text description gets its own columns:
 *  - Contact: person name, email, number
 *  - Portal:  username/email, password, link (the enrolment portal login)
 *  - Agreement: an uploaded file, admin-access only (path + original name)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->string('contact_person_name')->nullable()->after('description');
            $table->string('contact_email')->nullable()->after('contact_person_name');
            $table->string('contact_number')->nullable()->after('contact_email');
            $table->string('portal_username')->nullable()->after('contact_number');
            $table->string('portal_password')->nullable()->after('portal_username');
            $table->text('portal_link')->nullable()->after('portal_password');
            $table->string('agreement_path')->nullable()->after('portal_link');
            $table->string('agreement_name')->nullable()->after('agreement_path');
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $table->dropColumn([
                'contact_person_name', 'contact_email', 'contact_number',
                'portal_username', 'portal_password', 'portal_link',
                'agreement_path', 'agreement_name',
            ]);
        });
    }
};
