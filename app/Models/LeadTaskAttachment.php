<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class LeadTaskAttachment extends Model
{
    protected $fillable = [
        'lead_task_id', 'file_path', 'original_filename',
        'mime_type', 'size', 'uploaded_by',
    ];

    protected $appends = ['url', 'is_image'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(LeadTask::class, 'lead_task_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with((string) $this->mime_type, 'image/');
    }
}
