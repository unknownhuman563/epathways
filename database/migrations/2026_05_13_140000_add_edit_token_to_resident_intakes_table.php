<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            // Opaque token the admin generates and shares so the applicant can
            // open the form pre-filled with their data and add more details / PDFs.
            $table->string('edit_token', 64)->nullable()->unique()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('resident_intakes', function (Blueprint $table) {
            $table->dropUnique(['edit_token']);
            $table->dropColumn('edit_token');
        });
    }
};
