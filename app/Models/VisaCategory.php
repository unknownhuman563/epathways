<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A visa category (Student, Work, Visitor, …). Groups visa types and INZ forms
 * by the same category name, so a case's visa → category → its INZ forms.
 */
class VisaCategory extends Model
{
    protected $fillable = ['name', 'code', 'description'];

    /** Visa types currently assigned to this category (linked by name). */
    public function visaTypes()
    {
        return VisaType::where('category', $this->name);
    }

    /** INZ forms in this category (linked by name). */
    public function inzForms()
    {
        return InzForm::where('category', $this->name);
    }
}
