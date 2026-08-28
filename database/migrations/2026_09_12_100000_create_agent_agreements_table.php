<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_agreements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            // The editable fillable + Schedule A values captured at generation.
            $table->json('fields')->nullable();
            // The generated PDF on the private disk.
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime')->default('application/pdf');
            $table->unsignedBigInteger('size')->default(0);
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('agent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_agreements');
    }
};
