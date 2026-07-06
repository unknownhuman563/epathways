<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MessageTemplate extends Model
{
    use LogsActivity, SoftDeletes;

    public const CHANNELS = ['email', 'sms'];

    /** Departments that can own templates. null department = shared/global. */
    public const DEPARTMENTS = User::PORTAL_ROLES;

    protected $fillable = [
        'key',
        'department',
        'name',
        'description',
        'channels',
        'email_subject',
        'email_body',
        'from_email',
        'from_name',
        'banner_image',
        'footer_image',
        'sms_body',
        'variables_documented',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'channels' => 'array',
        'variables_documented' => 'array',
        'is_active' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Scope to a department's own templates ('' / null = the shared set). */
    public function scopeForDepartment(Builder $query, ?string $department): Builder
    {
        return $query->where('department', $department ?: '');
    }

    /**
     * Resolve an active template by key for a department: the department's own
     * version wins, falling back to the shared/global ('') template of that key.
     */
    public static function resolve(string $key, ?string $department = null): ?self
    {
        $template = $department
            ? static::active()->where('department', $department)->where('key', $key)->first()
            : null;

        return $template ?? static::active()->where('department', '')->where('key', $key)->first();
    }

    /** Does this template send on the given channel? */
    public function hasChannel(string $channel): bool
    {
        return in_array($channel, $this->channels ?? [], true);
    }
}
