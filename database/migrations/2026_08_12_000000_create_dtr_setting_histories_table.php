<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit trail for DTR setup changes — one row per save of a staffer's yellow
 * cells (schedule, timezone, std hours, etc.), capturing which fields changed,
 * their before/after values, and who made the change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dtr_setting_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();       // whose DTR
            $table->unsignedBigInteger('changed_by')->nullable(); // admin who edited
            $table->string('changed_by_name')->nullable();        // name snapshot
            $table->string('action', 20)->default('updated');     // created | updated
            $table->json('changes');                              // { field: {from, to} }
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dtr_setting_histories');
    }
};
