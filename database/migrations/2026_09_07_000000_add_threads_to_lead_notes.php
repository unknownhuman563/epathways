<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Internal notes become threaded (a note can reply to another) and can carry
// media attachments. Both additive + nullable so existing notes are untouched.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_notes', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('lead_id');
            // [{path, original_name, mime, size}] on the private disk.
            $table->json('attachments')->nullable()->after('body');
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::table('lead_notes', function (Blueprint $table) {
            $table->dropIndex(['parent_id']);
            $table->dropColumn(['parent_id', 'attachments']);
        });
    }
};
