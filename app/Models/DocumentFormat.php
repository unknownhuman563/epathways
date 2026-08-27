<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A reusable, staff-built document format (Word-style rich text). */
class DocumentFormat extends Model
{
    protected $fillable = ['name', 'category', 'content', 'visa_types', 'status', 'created_by'];

    protected $casts = ['visa_types' => 'array'];

    public function uses(): HasMany
    {
        return $this->hasMany(DocumentFormatCase::class);
    }
}
