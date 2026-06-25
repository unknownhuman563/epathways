<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_record_analyses', function (Blueprint $table) {
            $table->id();
            $table->morphs('record'); // record_type + record_id (extensible to cases/students)
            $table->enum('health', ['hot', 'warm', 'cold', 'critical', 'unknown']);
            $table->text('summary'); // 1-2 sentence reasoning
            $table->json('flags')->nullable();
            $table->json('recommendations')->nullable();
            $table->integer('score')->nullable(); // 0-100 quality score
            $table->string('model_used')->nullable();
            $table->integer('tokens_used')->nullable();
            // Nullable only to satisfy MySQL strict mode (two non-default
            // TIMESTAMP NOT NULL columns is an error); always set by the app.
            $table->timestamp('analyzed_at')->nullable();
            $table->timestamp('expires_at')->nullable(); // analyzed_at + cache window
            $table->timestamps();

            $table->index(['record_type', 'record_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_record_analyses');
    }
};
