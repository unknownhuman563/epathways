<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * A standalone ("general") pre-tenancy form submission — captured from the
 * shared public link rather than the onboarding funnel. Feeds the Forms →
 * Pre-Tenancy list and the Agreements client picker alongside onboarding
 * submissions.
 */
class PreTenancyForm extends Model
{
    protected $fillable = [
        'reference', 'full_legal_name', 'email', 'mobile',
        'current_address', 'property_address', 'data', 'submitted_at',
    ];

    protected $casts = [
        'data' => 'array',
        'submitted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $form) {
            if (empty($form->reference)) {
                $form->reference = 'PT-'.strtoupper(Str::random(6));
            }
        });
    }

    public function agreements()
    {
        return $this->hasMany(AccommodationAgreement::class);
    }
}
