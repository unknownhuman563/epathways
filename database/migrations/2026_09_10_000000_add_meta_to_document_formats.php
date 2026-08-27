<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Document-format metadata: client-facing vs internal grouping, which visa
// types the format is offered on, and whether it's live or still a draft.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_formats', function (Blueprint $table) {
            $table->string('category', 20)->default('client_facing')->after('name'); // client_facing | internal
            $table->json('visa_types')->nullable()->after('content');                // ["AEWV", ...]
            $table->string('status', 12)->default('draft')->after('visa_types');      // draft | live
        });
    }

    public function down(): void
    {
        Schema::table('document_formats', function (Blueprint $table) {
            $table->dropColumn(['category', 'visa_types', 'status']);
        });
    }
};
