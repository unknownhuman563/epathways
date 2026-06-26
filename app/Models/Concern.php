<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Concern extends Model
{
    protected $table = 'accommodation_concerns';

    /** Handling states — track whether a concern has been checked/investigated/fixed. */
    public const STATUSES = ['new', 'investigating', 'checked', 'fixed'];

    protected $fillable = [
        'name', 'email', 'message', 'tenant_id', 'property_id', 'status', 'assigned_to_user_id',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }
}
