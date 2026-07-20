<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class LeadDocument extends Model
{
    use LogsActivity;

    public const STATUS_SUBMITTED = 'Submitted';

    public const STATUS_UNDER_REVIEW = 'UnderReview';

    public const STATUS_APPROVED = 'Approved';

    public const STATUS_REJECTED = 'Rejected';

    public const STATUS_STAFF_SHARED = 'StaffShared';

    public const SOURCE_UPLOAD = 'upload';

    public const SOURCE_GENERATED = 'generated';

    protected $fillable = [
        'lead_id', 'request_id', 'checklist_key',
        'original_name', 'file_path', 'mime', 'size',
        'status', 'source', 'source_variant', 'note',
        'uploaded_by', 'reviewed_by', 'reviewed_at',
        'engagement_signer_id', 'client_signature_path',
        'client_signed_at', 'client_signer_name', 'client_signer_ip',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'client_signed_at' => 'datetime',
        'size' => 'integer',
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
