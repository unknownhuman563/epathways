<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * One of the 16 process steps (Build 12 phase 4.5). Static definition, seeded —
 * owner_role (a function, not a person), stage mapping, SLA, gate flag,
 * depends_on DAG and applies_when predicate. See CaseStepService.
 */
class CaseStepTemplate extends Model
{
    protected $fillable = [
        'step_key', 'position', 'label', 'owner_role', 'stage',
        'sla', 'gate', 'is_qc', 'channels_required', 'depends_on', 'applies_when',
    ];

    protected $casts = [
        'sla' => 'array',
        'gate' => 'boolean',
        'is_qc' => 'boolean',
        'channels_required' => 'boolean',
        'depends_on' => 'array',
        'applies_when' => 'array',
    ];

    /** The whole chain, in activation order. */
    public static function chain()
    {
        return static::orderBy('position')->get();
    }
}
