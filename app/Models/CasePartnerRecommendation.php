<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The partner-visa fork before step 06 (Build 12 phase 4.5, §15.6). The
 * recommendation of who should be the main applicant is ADVICE — authored by
 * the adviser under the licence gate at the write path; the client's written
 * choice is a consent-like record (a document reference). The fork blocks step
 * 06 until the client's choice is on file.
 */
class CasePartnerRecommendation extends Model
{
    protected $table = 'case_partner_recommendation';

    protected $fillable = [
        'lead_id', 'recommended_main_applicant', 'recommendation_reason',
        'client_choice', 'choice_document_id', 'decided_at', 'recorded_by',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** The fork is resolved once the client's written choice is recorded. */
    public function isResolved(): bool
    {
        return filled($this->client_choice) && $this->choice_document_id !== null;
    }
}
