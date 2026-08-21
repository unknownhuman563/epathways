<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// A document/case comment can be shared with the client ("Client sees this")
// or kept staff-internal (default). When shared it surfaces in the client
// portal / reminder email as a "TO CLIENT" note.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_threads', function (Blueprint $table) {
            $table->boolean('client_visible')->default(false)->after('requires_answer');
        });
    }

    public function down(): void
    {
        Schema::table('case_threads', function (Blueprint $table) {
            $table->dropColumn('client_visible');
        });
    }
};
