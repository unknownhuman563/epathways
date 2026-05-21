<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Free-form internal notes attached to a Lead. Used by sales/admin/any
 * department staff to capture context from calls and meetings — "doesn't
 * want Auckland", "partner hesitant", "budget tight", etc. Authored by
 * staff users; never visible to leads in their own portal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_name', 120)->nullable();   // snapshot in case user deleted
            $table->string('author_role', 50)->nullable();
            $table->text('body');
            $table->boolean('pinned')->default(false);
            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_notes');
    }
};
