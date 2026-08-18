<?php

use App\Models\Lead;
use App\Models\VisaType;
use Illuminate\Database\Migrations\Migration;

/**
 * Populate engagement_fee_total for packs generated before the fee was stored,
 * using the case's visa professional fee (normal / onshore) as a best estimate,
 * so the Generated Documents "Total amount" column shows an agreement amount
 * instead of a dash.
 */
return new class extends Migration
{
    public function up(): void
    {
        Lead::query()
            ->whereNull('engagement_fee_total')
            ->whereHas('documents', fn ($q) => $q->where('source_variant', 'like', 'engagement:%'))
            ->chunkById(200, function ($leads) {
                foreach ($leads as $lead) {
                    $visa = $lead->inz_visa_type
                        ? VisaType::where('name', $lead->inz_visa_type)->first()
                        : null;
                    $fee = $visa?->professionalFeeFor('normal', 'onshore');

                    if ($fee !== null) {
                        $lead->forceFill(['engagement_fee_total' => $fee])->save();
                    }
                }
            });
    }

    public function down(): void
    {
        // No-op: backfilled estimates aren't distinguishable from real values.
    }
};
