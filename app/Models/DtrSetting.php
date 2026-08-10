<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DtrSetting extends Model
{
    protected $fillable = [
        'user_id', 'label', 'position', 'team', 'timezone',
        'sched_in', 'sched_out', 'break_hours', 'reports_to',
        'std_hours', 'grace_mins', 'break_after', 'is_complete',
    ];

    protected $casts = [
        'break_hours' => 'decimal:2',
        'std_hours' => 'decimal:2',
        'break_after' => 'decimal:2',
        'grace_mins' => 'integer',
        'is_complete' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
