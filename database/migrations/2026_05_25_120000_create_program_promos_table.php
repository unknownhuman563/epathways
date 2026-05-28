<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_promos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            // Percent off — 0..100 with 2dp so 12.50% is representable.
            $table->decimal('percent', 5, 2)->default(0);
            $table->date('date_from');
            $table->date('date_end');
            // Lets staff turn a promo off without deleting it (and without
            // having to fudge the dates).
            $table->boolean('is_active')->default(true);
            // Optional coupon code the lead can mention. Indexed because we
            // may eventually look up by code from the lead-capture flow.
            $table->string('promo_code', 60)->nullable()->index();
            // Visual asset for the public banner. Lives under
            // storage/app/public/promos/banners (deploy excludes user uploads
            // from rsync --delete; see docs/deployment.md).
            $table->string('banner_image')->nullable();
            $table->string('cta_label', 80)->nullable();
            $table->string('cta_link', 500)->nullable();
            // Audit — set by controller; nullable so background scripts
            // creating promos don't blow up.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Hot-path index — the public-banner query filters by these three.
            $table->index(['is_active', 'date_from', 'date_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_promos');
    }
};
