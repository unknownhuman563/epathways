<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A single audited change to a staffer's DTR setup. `changes` holds a map of
 * field => {from, to} for every field that moved in that save.
 */
class DtrSettingHistory extends Model
{
    protected $fillable = [
        'user_id', 'changed_by', 'changed_by_name', 'action', 'changes',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
