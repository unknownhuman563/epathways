<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * Marketing content for the home-page "Visa Approved" carousel + the
 * /visa-approved gallery. Managed via /admin/visa-approvals CRUD by
 * super_admin / admin / immigration / sales / education roles.
 *
 * Public views should filter to is_published = true; use the
 * `published` scope for that.
 */
class VisaApproval extends Model
{
    protected $fillable = [
        'lead_id',
        'display_name',
        'country',
        'approved_at',
        'image_path',
        'caption',
        'is_featured',
        'is_published',
        'created_by',
    ];

    protected $casts = [
        'approved_at'   => 'date',
        'is_featured'   => 'boolean',
        'is_published'  => 'boolean',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    /**
     * Public URL for the uploaded image. Uses the `public` disk which
     * requires `php artisan storage:link` to have been run once so
     * /storage/... paths resolve.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image_path) return null;
        return Storage::disk('public')->url($this->image_path);
    }

    /**
     * Compact serializer for both admin table + public showcase.
     */
    public function toPublicArray(): array
    {
        return [
            'id'            => $this->id,
            'display_name'  => $this->display_name,
            'country'       => $this->country,
            'approved_at'   => $this->approved_at?->toDateString(),
            'approved_label'=> $this->approved_at?->format('F Y'),
            'batch_label'   => $this->approved_at ? ($this->approved_at->format('Y') . ' Batch') : null,
            'image_url'     => $this->image_url,
            'caption'       => $this->caption,
            'is_featured'   => (bool) $this->is_featured,
            'is_published'  => (bool) $this->is_published,
        ];
    }
}
