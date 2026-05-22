<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseAuditView extends Model
{
    public $timestamps = false;
    protected $fillable = [
        'lead_id', 'viewer_id', 'viewer_name', 'viewer_role',
        'action', 'context', 'ip', 'viewed_at',
    ];
    protected $casts = ['viewed_at' => 'datetime'];

    public function lead()   { return $this->belongsTo(Lead::class); }
    public function viewer() { return $this->belongsTo(User::class, 'viewer_id'); }
}
