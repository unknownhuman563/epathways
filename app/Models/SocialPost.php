<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SocialPost extends Model
{
    public const STATUS_AWAITING = 'awaiting_review';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_PUBLISHED = 'published';

    protected $fillable = [
        'campaign_id',
        'campaign_name',
        'service',
        'platform',
        'headline',
        'body',
        'cta',
        'hashtags',
        'thumbnail_url',
        'model',
        'status',
        'zernio_post_id',
        'scheduled_at',
        'created_by',
    ];

    protected $casts = [
        'hashtags' => 'array',
        'scheduled_at' => 'datetime',
    ];

    /** Stable campaign id derived from the campaign name. */
    public static function campaignId(string $name): string
    {
        return 'c_'.substr(md5($name), 0, 8);
    }

    /** Frontend variant shape the Social MVP review queue expects. */
    public function toVariant(): array
    {
        return [
            'id' => (string) $this->id,
            'campaign_id' => $this->campaign_id,
            'campaign_name' => $this->campaign_name,
            'service' => $this->service,
            'platform' => $this->platform,
            'headline' => $this->headline,
            'body' => $this->body,
            'cta' => $this->cta,
            'thumbnail_url' => $this->thumbnail_url,
            'model' => $this->model,
            'created_at' => optional($this->created_at)?->toIso8601String(),
        ];
    }

    /** Compose the variant into a single post body for Zernio. */
    public function composeContent(): string
    {
        $parts = array_filter([$this->headline, $this->body, $this->cta]);
        $content = implode("\n\n", $parts);

        $tags = collect($this->hashtags ?? [])
            ->map(fn ($h) => '#'.ltrim(Str::of($h)->trim(), '#'))
            ->filter(fn ($h) => $h !== '#')
            ->implode(' ');

        return $tags ? trim($content."\n\n".$tags) : trim($content);
    }
}
