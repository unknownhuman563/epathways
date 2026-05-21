<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FacebookLiveSession extends Model
{
    use LogsActivity;

    protected $fillable = [
        'title',
        'description',
        'fb_link',
        'image',
        'session_date',
    ];

    protected $casts = [
        'session_date' => 'date',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image
            ? Storage::disk('public')->url($this->image)
            : null;
    }

    /** Keep the activity action key short: "facebook_live.created" etc. */
    public function activityNoun(): string
    {
        return 'facebook_live';
    }
}
