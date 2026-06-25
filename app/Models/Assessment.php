<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Assessment extends Model
{
    /** How long a locked price stays valid before the payment page refreshes it. */
    public const LOCK_DAYS = 30;

    protected $fillable = [
        'token',
        'visa_type_id',
        'intakeable_type',
        'intakeable_id',
        'applicant_first_name',
        'applicant_last_name',
        'applicant_email',
        'applicant_phone',
        'applicant_country',
        'locked_price_nzd',
        'locked_price_at',
        'locked_price_expires_at',
        'payment_status',
        'payment_session_id',
        'payment_amount_cents',
        'payment_currency',
        'paid_at',
        'booking_id',
        'status',
    ];

    protected $casts = [
        'locked_price_nzd'        => 'decimal:2',
        'locked_price_at'         => 'datetime',
        'locked_price_expires_at' => 'datetime',
        'paid_at'                 => 'datetime',
        'payment_amount_cents'    => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Assessment $assessment) {
            if (empty($assessment->token)) {
                $assessment->token = self::generateUniqueToken();
            }
        });
    }

    public static function generateUniqueToken(): string
    {
        do {
            $token = Str::random(48);
        } while (self::query()->where('token', $token)->exists());
        return $token;
    }

    public function visaType(): BelongsTo
    {
        return $this->belongsTo(VisaType::class);
    }

    public function intakeable(): MorphTo
    {
        return $this->morphTo();
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function isPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function isLockedPriceExpired(): bool
    {
        return $this->locked_price_expires_at
            && $this->locked_price_expires_at->isPast();
    }

    /**
     * Snapshot the current visa-type price onto this assessment and stamp
     * the lock window. Called once at submit time and again on the payment
     * page if the previous lock has expired.
     */
    public function lockCurrentPrice(): void
    {
        $this->load('visaType');
        $this->locked_price_nzd        = (float) $this->visaType->consultation_price_nzd;
        $this->locked_price_at         = Carbon::now();
        $this->locked_price_expires_at = Carbon::now()->addDays(self::LOCK_DAYS);
        $this->save();
    }

    /**
     * Idempotent helper used by both the intake controllers and the
     * backfill command. Creates an Assessment row paired to the given
     * intake (any of the four *Intake models) plus the resolved VisaType,
     * snapshots the applicant identity fields, and locks the current
     * consultation price. Returns null when the matching VisaType can't
     * be resolved — caller is responsible for logging that case.
     *
     * Re-running this for an intake that already has a paired Assessment
     * returns the existing row without modifying it; payment_status,
     * locked price, etc., are left intact.
     *
     * Payment + booking remain intentionally untouched here: this method
     * only creates the tracking record so the portal Assessments page +
     * Convert flow have something to hang off. Pay/Book wiring stays in
     * AssessmentController behind the dormant Pay → Book redirects.
     */
    public static function createForIntake(\Illuminate\Database\Eloquent\Model $intake, ?\App\Models\VisaType $visaType): ?self
    {
        if (! $visaType) {
            return null;
        }

        $intakeClass = $intake::class;

        // Idempotency — never duplicate per (intakeable_type, intakeable_id).
        $existing = static::query()
            ->where('intakeable_type', $intakeClass)
            ->where('intakeable_id', $intake->getKey())
            ->first();
        if ($existing) {
            return $existing;
        }

        // ResidentIntake stores the family name on `last_name`; Work /
        // Student / Visitor intakes use `family_name`. Snapshot whichever
        // is set so the assessment carries a usable applicant identity
        // without loading the intake row later.
        $lastName = $intake->last_name ?? $intake->family_name ?? null;

        $assessment = static::create([
            'visa_type_id'         => $visaType->id,
            'intakeable_type'      => $intakeClass,
            'intakeable_id'        => $intake->getKey(),
            'applicant_first_name' => $intake->first_name ?? null,
            'applicant_last_name'  => $lastName,
            'applicant_email'      => $intake->email ?? '',
            'applicant_phone'      => $intake->phone ?? null,
            'applicant_country'    => $intake->country_of_citizenship ?? $intake->nationality ?? null,
            'status'               => 'submitted',
            'payment_status'       => 'pending',
        ]);

        $assessment->lockCurrentPrice();

        return $assessment;
    }
}
