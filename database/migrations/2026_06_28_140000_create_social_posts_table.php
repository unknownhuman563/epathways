<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AI-generated social post variants and their review → publish lifecycle.
 * Cerebras generates them (awaiting_review); staff edit / reject / approve;
 * on approve they're published or scheduled through Zernio (zernio_post_id
 * links the row to the live post).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_posts', function (Blueprint $table) {
            $table->id();
            $table->string('campaign_id')->index();      // groups variants of one campaign
            $table->string('campaign_name');
            $table->string('service')->nullable();        // education|immigration|accommodation
            $table->string('platform');                   // facebook|instagram|...
            $table->string('headline')->nullable();
            $table->longText('body')->nullable();
            $table->string('cta')->nullable();
            $table->json('hashtags')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->string('model')->nullable();          // which AI produced it
            $table->string('status')->default('awaiting_review')->index();
            $table->string('zernio_post_id')->nullable(); // set once published/scheduled
            $table->timestamp('scheduled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_posts');
    }
};
