<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Free-form tags on leads. Two tables:
 *   - lead_tags: the tag dictionary (name + colour). New tags auto-create
 *     on first use, so sales can type whatever they want and it
 *     auto-organises. Admin can later rename/delete tags via a settings
 *     page (not in v1).
 *   - lead_tag_lead: pivot binding leads to tags.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->unique();   // case-insensitive uniqueness enforced at app layer
            $table->string('slug', 80)->unique();   // url-safe key
            $table->string('color', 20)->default('gray');  // one of the palette keys (gray/red/amber/green/blue/...)
            $table->timestamps();
        });

        Schema::create('lead_tag_lead', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lead_tag_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // who tagged it
            $table->timestamps();

            $table->unique(['lead_id', 'lead_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_tag_lead');
        Schema::dropIfExists('lead_tags');
    }
};
