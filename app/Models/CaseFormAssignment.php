<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An INZ form sent to a client to fill in the lead portal. Client fills the
 * mapped fields; staff review then merge into the official PDF.
 */
class CaseFormAssignment extends Model
{
    protected $fillable = [
        'lead_id', 'inz_form_id', 'inz_form_version_id', 'status', 'field_values',
        'assigned_by', 'submitted_at', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'field_values' => 'array',
        'submitted_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function form(): BelongsTo
    {
        return $this->belongsTo(InzForm::class, 'inz_form_id');
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(InzFormVersion::class, 'inz_form_version_id');
    }
}
