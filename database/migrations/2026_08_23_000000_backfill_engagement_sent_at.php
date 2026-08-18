<?php

use App\Models\Lead;
use Illuminate\Database\Migrations\Migration;

/**
 * Engagement packs generated BEFORE the draft feature have no engagement_sent_at,
 * so they incorrectly show as "Draft". Backfill them as already sent (using the
 * latest engagement document's created_at) so only genuinely new "Save as draft"
 * packs read as drafts going forward.
 */
return new class extends Migration
{
    public function up(): void
    {
        Lead::query()
            ->whereNull('engagement_sent_at')
            ->whereHas('documents', fn ($q) => $q->where('source_variant', 'like', 'engagement:%'))
            ->chunkById(200, function ($leads) {
                foreach ($leads as $lead) {
                    $last = $lead->documents()
                        ->where('source_variant', 'like', 'engagement:%')
                        ->max('created_at');

                    if ($last) {
                        $lead->forceFill(['engagement_sent_at' => $last])->save();
                    }
                }
            });
    }

    public function down(): void
    {
        // No-op: we can't distinguish backfilled values from real sends.
    }
};
