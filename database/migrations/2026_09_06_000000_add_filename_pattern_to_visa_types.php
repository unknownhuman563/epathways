<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Visa-level standard filename pattern applied to every checklist upload unless
// the item defines its own override. Null = keep the client's original filename.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->string('filename_pattern', 160)->nullable()->after('checklist_items');
        });
    }

    public function down(): void
    {
        Schema::table('visa_types', function (Blueprint $table) {
            $table->dropColumn('filename_pattern');
        });
    }
};
