<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tag where a document request came from so the UI can group them. The first
 * user is the RFI flow: when staff attach INZ's RFI letter, the documents INZ
 * asks for are extracted and created as requests with origin='rfi', shown under
 * a dedicated "Request Information" section on the Documents tab and client
 * portal. Null = an ordinary ad-hoc staff request ("Requested from client").
 *
 * This is the small `lead_document_requests` table, NOT the `leads` god table —
 * a plain VARCHAR column is safe here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_document_requests', function (Blueprint $table) {
            $table->string('origin', 40)->nullable()->after('required');
        });
    }

    public function down(): void
    {
        Schema::table('lead_document_requests', function (Blueprint $table) {
            $table->dropColumn('origin');
        });
    }
};
