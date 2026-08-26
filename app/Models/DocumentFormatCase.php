<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One case's use of a document format, with its own edited copy of the content. */
class DocumentFormatCase extends Model
{
    protected $table = 'document_format_case';

    protected $fillable = ['document_format_id', 'lead_id', 'content', 'state', 'created_by'];

    public function format(): BelongsTo
    {
        return $this->belongsTo(DocumentFormat::class, 'document_format_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}
