<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A folder that groups message templates. Department-scoped: a folder lives
 * under one department tab ('' = the Shared / all-departments tab). Deleting a
 * folder leaves its templates intact (their folder_id is nulled via the FK's
 * nullOnDelete).
 */
class TemplateFolder extends Model
{
    protected $fillable = ['name', 'department', 'created_by'];

    public function templates(): HasMany
    {
        return $this->hasMany(MessageTemplate::class, 'folder_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
