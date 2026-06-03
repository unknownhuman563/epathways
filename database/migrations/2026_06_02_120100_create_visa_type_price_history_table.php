<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visa_type_price_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('visa_type_id')->constrained()->cascadeOnDelete();
            // Nullable for the very first entry where there's no "old" price.
            $table->decimal('old_price_nzd', 8, 2)->nullable();
            $table->decimal('new_price_nzd', 8, 2);
            $table->foreignId('changed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('reason');
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->index(['visa_type_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visa_type_price_history');
    }
};
