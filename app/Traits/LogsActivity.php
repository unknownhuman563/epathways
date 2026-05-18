<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Automatically writes an activity_logs row whenever the model is created,
 * updated or deleted. Feeds the same audit trail as ActivityLog::record(),
 * so entries show up on the admin Activity Log page alongside sign-ins etc.
 *
 * Actions follow the existing "noun.verb" convention, e.g. "event.created",
 * "program.updated", "booking.deleted".
 *
 * A model may override activityNoun(), activityLabel() or
 * activityIgnoredAttributes() to fine-tune what gets logged.
 */
trait LogsActivity
{
    /** Attributes never worth recording in an update diff (every model). */
    private array $activityGlobalIgnored = [
        'created_at',
        'updated_at',
        'password',
        'remember_token',
    ];

    public static function bootLogsActivity(): void
    {
        static::created(fn ($model) => $model->recordActivity('created'));
        static::updated(fn ($model) => $model->recordActivity('updated'));
        static::deleted(fn ($model) => $model->recordActivity('deleted'));
    }

    public function recordActivity(string $verb): void
    {
        try {
            $label = $this->activityLabel();

            $properties = [
                'subject_type' => class_basename($this),
                'subject_id'   => $this->getKey(),
                'subject_label' => $label,
            ];

            if ($verb === 'updated') {
                $changes = $this->activityChanges();

                // The save touched nothing meaningful (e.g. only timestamps) — skip.
                if (empty($changes)) {
                    return;
                }

                $properties['changes'] = $changes;
            }

            ActivityLog::record($this->activityNoun().'.'.$verb, [
                'description' => sprintf(
                    '%s %s "%s"',
                    ucfirst($verb),
                    str_replace('_', ' ', $this->activityNoun()),
                    $label
                ),
                'properties' => $properties,
            ]);
        } catch (\Throwable $e) {
            // Auditing must never break the actual operation.
            Log::error('Activity log failed', [
                'model' => static::class,
                'id'    => $this->getKey(),
                'verb'  => $verb,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Machine-friendly resource name used in the action key, e.g. "event".
     */
    public function activityNoun(): string
    {
        return Str::snake(class_basename($this));
    }

    /**
     * Short, human-readable name for this record.
     */
    public function activityLabel(): string
    {
        foreach (['title', 'name'] as $key) {
            if (! empty($this->{$key})) {
                return (string) $this->{$key};
            }
        }

        $fullName = trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
        if ($fullName !== '') {
            return $fullName;
        }

        foreach (['intake_id', 'review_id', 'lead_id', 'event_code', 'email'] as $key) {
            if (! empty($this->{$key})) {
                return (string) $this->{$key};
            }
        }

        return '#'.$this->getKey();
    }

    /**
     * Attributes to leave out of update diffs, on top of the global list.
     * Override per-model for noisy/irrelevant columns.
     *
     * @return array<int, string>
     */
    public function activityIgnoredAttributes(): array
    {
        return [];
    }

    /**
     * Field-level before/after diff for an update.
     *
     * @return array<string, array{old: mixed, new: mixed}>
     */
    protected function activityChanges(): array
    {
        $ignored = array_merge($this->activityGlobalIgnored, $this->activityIgnoredAttributes());
        $changes = [];

        foreach (array_keys($this->getChanges()) as $attribute) {
            if (in_array($attribute, $ignored, true)) {
                continue;
            }

            $changes[$attribute] = [
                'old' => $this->activityValue($this->getOriginal($attribute)),
                'new' => $this->activityValue($this->getAttribute($attribute)),
            ];
        }

        return $changes;
    }

    /**
     * Keep logged values compact and JSON-friendly.
     */
    protected function activityValue(mixed $value): mixed
    {
        if (is_array($value)) {
            return '[…]';
        }

        if (is_string($value) && strlen($value) > 200) {
            return Str::limit($value, 200);
        }

        return $value;
    }
}
