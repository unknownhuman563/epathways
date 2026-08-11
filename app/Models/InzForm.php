<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An INZ form in the catalogue (e.g. INZ 1012 Student Visa Application). The
 * forms staff actually file are the OFFICIAL PDFs stored per version — this row
 * is the identity + which visa types need it.
 */
class InzForm extends Model
{
    protected $fillable = ['code', 'name', 'category', 'is_active', 'notes'];

    protected $casts = ['is_active' => 'boolean'];

    public function versions(): HasMany
    {
        return $this->hasMany(InzFormVersion::class);
    }

    /** The version that should be filed right now. */
    public function currentVersion(): ?InzFormVersion
    {
        return $this->versions()->where('is_current', true)->latest('id')->first();
    }

    public function visaTypes(): BelongsToMany
    {
        return $this->belongsToMany(VisaType::class, 'inz_form_visa_type')
            ->withPivot('required')->withTimestamps();
    }
}
