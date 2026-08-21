<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A case thread (Build 12 phase 6, §7): an anchored question that stays visible
 * until answered. Not a chat message — every thread anchors to the case, a
 * document, a gate, a stage or a step. Resolution is explicit and recorded
 * (resolved_at / resolved_by); nothing is deleted.
 *
 * Placement is derived from the anchor, not a feed: a document-anchored thread
 * renders on that document's row and nowhere else; a step-anchored thread on
 * that step; case/gate/stage threads in the Notes tab.
 */
class CaseThread extends Model
{
    public const ANCHOR_CASE = 'case';

    public const ANCHOR_DOCUMENT = 'document';

    public const ANCHOR_GATE = 'gate';

    public const ANCHOR_STAGE = 'stage';

    public const ANCHOR_STEP = 'step';

    public const ANCHOR_TYPES = [
        self::ANCHOR_CASE,
        self::ANCHOR_DOCUMENT,
        self::ANCHOR_GATE,
        self::ANCHOR_STAGE,
        self::ANCHOR_STEP,
    ];

    protected $fillable = [
        'lead_id', 'parent_id', 'anchor_type', 'anchor_id', 'anchor_key', 'anchor_attempt',
        'author_id', 'addressed_to_id', 'body', 'requires_answer', 'client_visible',
        'resolved_at', 'resolved_by',
    ];

    protected $casts = [
        'requires_answer' => 'boolean',
        'client_visible' => 'boolean',
        'anchor_attempt' => 'integer',
        'resolved_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function addressedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'addressed_to_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isResolved(): bool
    {
        return $this->resolved_at !== null;
    }

    /** @param  Builder<CaseThread>  $query */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('resolved_at');
    }

    /** @param  Builder<CaseThread>  $query */
    public function scopeAwaitingAnswer(Builder $query): Builder
    {
        return $query->whereNull('resolved_at')->where('requires_answer', true);
    }

    /**
     * How many open, answer-requiring threads are addressed to a user — the
     * count that lands the case in their queue alongside the cases they own.
     *
     * @return \Illuminate\Support\Collection<int, int> keyed by lead_id → count
     */
    public static function awaitingCountsFor(int $userId): \Illuminate\Support\Collection
    {
        return static::query()
            ->awaitingAnswer()
            ->where('addressed_to_id', $userId)
            ->selectRaw('lead_id, COUNT(*) as c')
            ->groupBy('lead_id')
            ->pluck('c', 'lead_id');
    }
}
