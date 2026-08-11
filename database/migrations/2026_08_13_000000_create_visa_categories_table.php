<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Visa categories — the shared taxonomy that groups visa types and INZ forms.
 * A case's visa type belongs to a category (visa_types.category), and INZ forms
 * carry the same category, so a case's category decides which INZ forms it can
 * generate. This table makes the category list itself CRUD-able (Setup → Category).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visa_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code', 20)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Seed the standard set so the taxonomy matches the existing category
        // strings on visa types and INZ forms.
        $now = now();
        foreach (['Student', 'Work', 'Visitor', 'Partnership', 'Residence', 'Cross-cutting'] as $name) {
            \Illuminate\Support\Facades\DB::table('visa_categories')->insert([
                'name' => $name, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('visa_categories');
    }
};
