<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            // 'upload' (default — uploaded by lead or staff) or 'generated'
            // (template-rendered by AgreementGenerator). Lets the UI tag
            // auto-generated docs with the green "Generated" pill so staff
            // can tell them apart from manually-uploaded files.
            $table->string('source', 20)->default('upload')->after('status');
            // Free-form key for the specific template/variant rendered, e.g.
            // 'consultancy:single' / 'consultancy:partner'. Null for normal
            // uploads.
            $table->string('source_variant', 60)->nullable()->after('source');
        });
    }

    public function down(): void
    {
        Schema::table('lead_documents', function (Blueprint $table) {
            $table->dropColumn(['source', 'source_variant']);
        });
    }
};
