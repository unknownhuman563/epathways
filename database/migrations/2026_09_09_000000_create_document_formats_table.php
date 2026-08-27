<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Reusable document formats (Word-style rich text) staff build in the portal,
// plus a per-case use of a format (the format applied to a case, with the
// content optionally edited for that case).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_formats', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->longText('content')->nullable();   // rich-text HTML
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });

        Schema::create('document_format_case', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_format_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->longText('content')->nullable();    // per-case edited copy
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->index(['document_format_id', 'lead_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_format_case');
        Schema::dropIfExists('document_formats');
    }
};
