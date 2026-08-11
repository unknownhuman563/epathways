<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DtrEntry extends Model
{
    protected $fillable = [
        'user_id', 'work_date', 'time_in', 'time_out', 'tasks', 'remarks',
    ];

    protected $casts = [
        'work_date' => 'date',
        'tasks' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
