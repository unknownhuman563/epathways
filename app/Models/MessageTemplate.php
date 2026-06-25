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

    protected $fillable = [
        'key',
        'name',
        'description',
        'channels',
        'email_subject',
        'email_body',
        'sms_body',
        'variables_documented',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'channels'             => 'array',
        'variables_documented' => 'array',
        'is_active'            => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Does this template send on the given channel? */
    public function hasChannel(string $channel): bool
    {
        return in_array($channel, $this->channels ?? [], true);
    }
}
