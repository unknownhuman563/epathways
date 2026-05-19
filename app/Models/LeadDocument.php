<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class LeadDocument extends Model
{
    use LogsActivity;

    public const STATUS_SUBMITTED    = 'Submitted';
    public const STATUS_UNDER_REVIEW = 'UnderReview';
    public const STATUS_APPROVED     = 'Approved';
    public const STATUS_REJECTED     = 'Rejected';
    public const STATUS_STAFF_SHARED = 'StaffShared';

    protected $fillable = [
        'lead_id', 'request_id',
        'original_name', 'file_path', 'mime', 'size',
        'status', 'note',
        'uploaded_by', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'size'        => 'integer',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function request()
    {
        return $this->belongsTo(LeadDocumentRequest::class, 'request_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
