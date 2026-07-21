<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VisaType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'name', 'short_description', 'category', 'visa_type',
        'consultation_price_nzd', 'professional_fees', 'inz_application_fee',
        'consultation_duration_minutes',
        'estimated_minutes', 'icon',
        'expected_processing_days',
        'inz_form_refs', 'checklist_items', 'notes', 'active',
    ];

    protected $casts = [
        'expected_processing_days' => 'integer',
        'consultation_price_nzd' => 'decimal:2',
        'professional_fees' => 'decimal:2',
        'inz_application_fee' => 'decimal:2',
        'consultation_duration_minutes' => 'integer',
        'estimated_minutes' => 'integer',
        'active' => 'boolean',
        // Per-visa document checklist: [{ key, label, hint?, required }].
        // Drives the lead's /track "Visa requirements" panel and the
        // Documents tab's checklist UI on the staff side.
        'checklist_items' => 'array',
    ];

    /**
     * Another visa whose `name` equals the given value, or null.
     *
     * A visa's code must never duplicate a different visa's name (and vice
     * versa): leads store their visa as a free-text string, so an ambiguous
     * value can no longer be resolved to a single catalogue row and the
     * applicant's tracker could show the wrong checklist. See
     * CaseChecklistService::resolveVisaType().
     */
    public static function otherNamed(?string $value, ?int $ignoreId = null): ?self
    {
        return self::collisionQuery('name', $value, $ignoreId);
    }

    /** Another visa whose `code` equals the given value, or null. */
    public static function otherCoded(?string $value, ?int $ignoreId = null): ?self
    {
        return self::collisionQuery('code', $value, $ignoreId);
    }

    private static function collisionQuery(string $column, ?string $value, ?int $ignoreId): ?self
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        return self::query()
            ->whereRaw("LOWER({$column}) = ?", [mb_strtolower($value)])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->first();
    }

    public function priceHistory(): HasMany
    {
        return $this->hasMany(VisaTypePriceHistory::class)->orderByDesc('changed_at');
    }

    public function getLatestPriceChangeAttribute(): ?VisaTypePriceHistory
    {
        return $this->priceHistory()->first();
    }
}
