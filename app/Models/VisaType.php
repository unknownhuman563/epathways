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
        'consultation_price_nzd', 'professional_fees', 'professional_fees_discounted',
        'professional_fees_offshore', 'professional_fees_discounted_offshore',
        'inz_application_fee', 'inz_application_fee_offshore',
        'consultation_duration_minutes',
        'estimated_minutes', 'icon',
        'expected_processing_days',
        'inz_form_refs', 'checklist_items', 'notes', 'active',
    ];

    protected $casts = [
        'expected_processing_days' => 'integer',
        'consultation_price_nzd' => 'decimal:2',
        'professional_fees' => 'decimal:2',
        'professional_fees_discounted' => 'decimal:2',
        'professional_fees_offshore' => 'decimal:2',
        'professional_fees_discounted_offshore' => 'decimal:2',
        'inz_application_fee' => 'decimal:2',
        'inz_application_fee_offshore' => 'decimal:2',
        'consultation_duration_minutes' => 'integer',
        'estimated_minutes' => 'integer',
        'active' => 'boolean',
        // Per-visa document checklist: [{ key, label, hint?, required }].
        // Drives the lead's /track "Visa requirements" panel and the
        // Documents tab's checklist UI on the staff side.
        'checklist_items' => 'array',
    ];

    /** NZ GST. Fees are stored exclusive; the RRP adds this on top. */
    public const GST_RATE = 0.15;

    /** The two pricing tiers a fee can be quoted at. */
    public const FEE_TIERS = ['discounted', 'normal'];

    /** Applicant location — onshore (in NZ) or offshore (abroad). */
    public const FEE_LOCATIONS = ['onshore', 'offshore'];

    /**
     * Which columns hold the fees for each applicant location — the two
     * professional-fee tiers plus that location's INZ application fee. The
     * onshore columns are the originals; offshore adds a parallel set. Keeping
     * the map here means every fee lookup resolves the same way.
     */
    private const FEE_FIELDS = [
        'onshore' => ['discounted' => 'professional_fees_discounted', 'normal' => 'professional_fees', 'inz' => 'inz_application_fee'],
        'offshore' => ['discounted' => 'professional_fees_discounted_offshore', 'normal' => 'professional_fees_offshore', 'inz' => 'inz_application_fee_offshore'],
    ];

    /**
     * The GST-exclusive professional fee for a given tier and applicant
     * location. "discounted" is the pay-now price, "normal" (the default) is
     * the payment-plan price; "onshore"/"offshore" pick the applicant's
     * location. Falls back to the normal fee for that location when a
     * discounted one hasn't been set, so a case quoted "discounted" never
     * renders a blank fee.
     */
    public function professionalFeeFor(string $tier = 'normal', string $location = 'onshore'): ?float
    {
        $fields = self::FEE_FIELDS[$location] ?? self::FEE_FIELDS['onshore'];
        $normal = $this->{$fields['normal']};

        $value = $tier === 'discounted'
            ? ($this->{$fields['discounted']} ?? $normal)
            : $normal;

        return $value === null ? null : (float) $value;
    }

    /**
     * The INZ (government) application fee for a given applicant location.
     * Onshore and offshore each carry their own charge; there is no
     * cross-location fallback, so an unset offshore fee reads as null rather
     * than borrowing the onshore figure.
     */
    public function inzFeeFor(string $location = 'onshore'): ?float
    {
        $field = (self::FEE_FIELDS[$location] ?? self::FEE_FIELDS['onshore'])['inz'];
        $value = $this->{$field};

        return $value === null ? null : (float) $value;
    }

    /**
     * The fee schedule for this visa at a given location, as the two tiers it
     * is quoted in.
     *
     * Only the GST-exclusive professional fee (per tier/location) and the
     * shared INZ fee are stored. The GST-inclusive RRP and the "prof fees +
     * INZ fee" total are computed here so every screen and generated document
     * reports the same arithmetic — a stored total would drift the moment a
     * fee is edited.
     *
     * @return array<int, array{tier: string, label: string, note: string, inz_fee: float|null, excl_gst: float|null, incl_gst: float|null, total: float|null}>
     */
    public function feeBreakdown(string $location = 'onshore'): array
    {
        $fields = self::FEE_FIELDS[$location] ?? self::FEE_FIELDS['onshore'];
        $inz = $this->{$fields['inz']} === null ? null : (float) $this->{$fields['inz']};

        $row = function (string $tier, string $label, string $note, $excl) use ($inz) {
            $excl = $excl === null ? null : (float) $excl;
            $incl = $excl === null ? null : round($excl * (1 + self::GST_RATE), 2);

            return [
                'tier' => $tier,
                'label' => $label,
                'note' => $note,
                'inz_fee' => $inz,
                'excl_gst' => $excl,
                'incl_gst' => $incl,
                // The INZ fee has no GST on it — it's a government charge
                // passed straight through, so it is added after the uplift.
                'total' => $incl === null && $inz === null
                    ? null
                    : round(($incl ?? 0) + ($inz ?? 0), 2),
            ];
        };

        return [
            $row('discounted', 'Discounted price', 'Pay now basis', $this->{$fields['discounted']}),
            $row('normal', 'Normal price', 'Payment plan', $this->{$fields['normal']}),
        ];
    }

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

    /** INZ forms this visa type needs (the version-tracked catalogue). */
    public function inzForms(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(InzForm::class, 'inz_form_visa_type')
            ->withPivot('required')->withTimestamps();
    }
}
