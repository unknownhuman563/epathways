<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            // Generic entity link — lets us audit any model with the same
            // shape as the spec ({entity_type}, {entity_id}, before/after).
            $table->string('entity_type')->nullable()->after('action');
            $table->unsignedBigInteger('entity_id')->nullable()->after('entity_type');
            // Field-by-field diff: {field: {old: ..., new: ...}}. Kept as
            // a sibling of `properties` to avoid forcing existing log writes
            // to migrate to a new shape.
            $table->json('changes')->nullable()->after('entity_id');
            // Free-form context for the action — e.g. price-change reason,
            // notification routing flags. `properties` is older free-form,
            // `metadata` is what new code writes to.
            $table->json('metadata')->nullable()->after('properties');

            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['entity_type', 'entity_id']);
            $table->dropColumn(['entity_type', 'entity_id', 'changes', 'metadata']);
        });
    }
};
