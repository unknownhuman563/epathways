<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class UserReview extends Model
{
    use LogsActivity;

    public const DEPT_IMMIGRATION = 'immigration';
    public const DEPT_EDUCATION   = 'education';
    public const DEPT_BOTH        = 'both';
    public const DEPARTMENTS      = [self::DEPT_IMMIGRATION, self::DEPT_EDUCATION, self::DEPT_BOTH];

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
    ];

    protected $casts = [
        'rating'       => 'integer',
        'is_published' => 'boolean',
        'is_featured'  => 'boolean',
    ];

    /**
     * Scope by department. Passing 'immigration' or 'education' includes
     * cross-dept reviews tagged 'both', so a client who used services from
     * both teams shows up on both pages.
     */
    public function scopeDepartment($query, ?string $dept)
    {
        if (!$dept) {
            return $query;
        }
        if ($dept === self::DEPT_BOTH) {
            return $query->where('department', self::DEPT_BOTH);
        }
        return $query->whereIn('department', [$dept, self::DEPT_BOTH]);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path
            ? Storage::disk('public')->url($this->photo_path)
            : null;
    }
}
