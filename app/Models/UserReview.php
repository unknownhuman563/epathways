<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class UserReview extends Model
{
    use LogsActivity;

    public const DEPT_IMMIGRATION = 'immigration';

    public const DEPT_EDUCATION = 'education';

    public const DEPT_BOTH = 'both';

    public const DEPARTMENTS = [self::DEPT_IMMIGRATION, self::DEPT_EDUCATION, self::DEPT_BOTH];

    // Where a review came from. 'onsite' = our public "Write a review" form;
    // 'google' = a Google Business Profile review (manual import now, API later).
    public const SOURCE_ONSITE = 'onsite';

    public const SOURCE_GOOGLE = 'google';

    public const SOURCES = [self::SOURCE_ONSITE, self::SOURCE_GOOGLE];

    protected $fillable = [
        'review_id',
        'name',
        'email',
        'mode',
        'answer_1',
        'answer_2',
        'answer_3',
        'paragraph',
        'rating',
        'status',
        'is_published',
        'is_featured',
        'visa_type',
        'program_type',
        'department',
        'photo_path',
        'source',
        'external_id',
        'external_photo_url',
        'review_date',
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'review_date' => 'datetime',
    ];

    // Surface the computed photo URL on every serialization so admin
    // tables / detail pages / the public ReviewsSection all see it
    // without each query having to remember to ->append('photo_url').
    protected $appends = ['photo_url'];

    /**
     * Scope by department. Passing 'immigration' or 'education' includes
     * cross-dept reviews tagged 'both', so a client who used services from
     * both teams shows up on both pages.
     */
    public function scopeDepartment($query, ?string $dept)
    {
        if (! $dept) {
            return $query;
        }
        if ($dept === self::DEPT_BOTH) {
            return $query->where('department', self::DEPT_BOTH);
        }

        return $query->whereIn('department', [$dept, self::DEPT_BOTH]);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if ($this->photo_path) {
            return Storage::disk('public')->url($this->photo_path);
        }

        // Google reviews carry the author's avatar as a remote URL we don't re-host.
        return $this->external_photo_url ?: null;
    }
}
