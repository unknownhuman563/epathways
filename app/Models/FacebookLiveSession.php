<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class FacebookLiveSession extends Model
{
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
}
