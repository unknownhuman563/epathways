<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Build 11.D Phase 2 — Database-stored agreement template.
 *
 * Body uses {{variable}} placeholders rendered via
 * App\Services\Immigration\AgreementService::renderTemplate.
 *
 * visa_type is a free-form string matched against leads.inz_visa_type
 * (also a string). null = generic / applies to any visa.
 */
class AgreementTemplate extends Model
{
    protected $fillable = [
        'name',
        'visa_type',
        'body',
        'required_variables',
        'is_active',
    ];

    protected $casts = [
        'required_variables' => 'array',
        'is_active'          => 'boolean',
    ];

    public function agreements(): HasMany
    {
        return $this->hasMany(Agreement::class);
    }
}
