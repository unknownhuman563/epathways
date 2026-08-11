<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One dated version of an INZ form: the official PDF, its per-version field map,
 * and the dates that decide whether it can still be filed. INZ renumbers/renames
 * AcroForm fields between revisions, so the field map is per version.
 */
class InzFormVersion extends Model
{
    protected $fillable = [
        'inz_form_id', 'version_label', 'file_path', 'is_acroform', 'field_map',
        'effective_from', 'accepted_until', 'is_current', 'checked_at', 'uploaded_by',
    ];

    protected $casts = [
        'field_map' => 'array',
        'is_acroform' => 'boolean',
        'is_current' => 'boolean',
        'effective_from' => 'date',
        'accepted_until' => 'date',
        'checked_at' => 'datetime',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(InzForm::class, 'inz_form_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** The official PDF is on file and ready to fill. */
    public function isReady(): bool
    {
        return filled($this->file_path);
    }

    /** A superseded version still inside its grace window (files-but-expiring). */
    public function isLapsing(int $withinDays = 30): bool
    {
        return $this->accepted_until !== null
            && $this->accepted_until->isFuture()
            && $this->accepted_until->diffInDays(now()) <= $withinDays;
    }

    /** A version that can no longer be filed. */
    public function hasLapsed(): bool
    {
        return $this->accepted_until !== null && $this->accepted_until->isPast();
    }
}
