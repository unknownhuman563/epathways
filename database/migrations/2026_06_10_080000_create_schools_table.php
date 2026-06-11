<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Schools — institutions the Education team places students into.
 * Modelled on the Programs catalog so it gets its own CRUD page and
 * can be referenced by FK from any student's lead row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('website')->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('active'); // active / inactive
            $table->timestamps();
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};
