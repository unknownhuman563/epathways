<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VisaType extends Model
{
    protected $fillable = [
        'code', 'name', 'category', 'expected_processing_days',
        'inz_form_refs', 'notes', 'active',
    ];

    protected $casts = [
        'expected_processing_days' => 'integer',
        'active'                   => 'boolean',
    ];
}
