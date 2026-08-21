<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Threaded replies: a comment can be a reply to another comment on the same
// anchor. Replies inherit the parent's anchor and render nested beneath it.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_threads', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('id')->index();
        });
    }

    public function down(): void
    {
        Schema::table('case_threads', function (Blueprint $table) {
            $table->dropColumn('parent_id');
        });
    }
};
