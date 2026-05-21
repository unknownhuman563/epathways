<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class LeadDocumentRequest extends Model
{
    use LogsActivity;

    protected $fillable = [
        'lead_id', 'label', 'description', 'required',
        'requested_by', 'requested_at',
    ];

    protected $casts = [
        'required'     => 'boolean',
        'requested_at' => 'datetime',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function documents()
    {
        return $this->hasMany(LeadDocument::class, 'request_id');
    }

    /** The most recently uploaded file against this request (if any). */
    public function latestDocument()
    {
        return $this->hasOne(LeadDocument::class, 'request_id')->latestOfMany();
    }
}
