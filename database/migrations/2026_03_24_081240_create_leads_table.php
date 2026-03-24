<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('lead_id')->unique()->nullable(); // e.g. LP-1042
            $table->string('first_name');
            $table->string('last_name');
            $table->integer('age')->nullable();
            
            // Supporting personal fields
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('gender')->nullable();
            $table->string('marital_status')->nullable();
            
            // Categorization
            $table->string('branch')->nullable();
            $table->string('stage')->nullable(); // Sales vs Goal Settings
            $table->string('status')->default('New');
            
            // Dynamic JSON arrays as requested user
            $table->json('work_info')->nullable();
            $table->json('financial_info')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
