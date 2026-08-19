<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Allow message_templates.key to be NULL so a duplicated template can arrive as
 * a keyless DRAFT (key set later, per department). The unique index on
 * (department, key) still holds: MySQL and SQLite both treat NULLs as distinct,
 * so many keyless drafts can coexist in the same department. A draft is created
 * inactive and cannot be resolved/sent until it's given a key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->string('key')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->string('key')->nullable(false)->change();
        });
    }
};
