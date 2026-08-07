<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * An AI completeness/consistency review of a visa-assessment intake. Internal,
 * indicative, unsigned — scaffolding for the licensed adviser, never advice or a
 * decision (immigration AI guardrails §1/§2). One row per run.
 */
class AssessmentAiReview extends Model
{
    protected $fillable = [
        'intakeable_type', 'intakeable_id', 'reviewed_by',
        'provider', 'model', 'observations', 'summary', 'raw',
        'risks', 'checklist', 'adviser_note', 'client_email',
    ];

    protected $casts = [
        'observations' => 'array',
        'risks' => 'array',
        'checklist' => 'array',
        'client_email' => 'array',
    ];

    public function intakeable(): MorphTo
    {
        return $this->morphTo();
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /** The latest review for a given intake, or null. */
    public static function latestFor(string $type, int $id): ?self
    {
        return static::where('intakeable_type', $type)
            ->where('intakeable_id', $id)
            ->latest('id')
            ->first();
    }
}
