<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DtrLeave extends Model
{
    public const TYPES = ['Vacation', 'Sick', 'Emergency', 'Rest Day', 'Unpaid', 'Other'];

    protected $fillable = [
        'user_id', 'type', 'start_date', 'end_date', 'reason',
        'status', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
