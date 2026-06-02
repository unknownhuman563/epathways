<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class EoiSubmission extends Model
{
    use LogsActivity;

    protected $table = 'accommodation_eoi_submissions';

    protected $fillable = [
        // Section 1
        'full_legal_name', 'id_number', 'visa_status', 'visa_status_other',
        'nationality', 'nationality_other', 'preferred_name', 'email', 'mobile', 'age',
        // Section 2
        'room_type_interest', 'property_interested', 'tenancy_start_date', 'stay_duration',
        // Section 3
        'occupants', 'occupant_ages', 'has_children', 'children_ages', 'has_pets', 'pet_details',
        // Section 4
        'rent_funding', 'rent_funding_other', 'employment_status', 'employment_status_other',
        // Section 5
        'current_address', 'has_rented_before', 'current_address_duration', 'living_situation', 'reason_for_moving',
        // Section 6
        'smokes_or_vapes', 'drinks_alcohol', 'work_hours', 'flatmate_description',
        // Section 7
        'viewing_available_7days', 'preferred_viewing_time',
        // Section 8
        'confirm_accurate', 'consent_collection',
        // Workflow
        'status', 'form_type',
    ];

    protected $casts = [
        'age' => 'integer',
        'tenancy_start_date' => 'date',
        'has_children' => 'boolean',
        'has_pets' => 'boolean',
        'has_rented_before' => 'boolean',
        'smokes_or_vapes' => 'boolean',
        'viewing_available_7days' => 'boolean',
        'confirm_accurate' => 'boolean',
        'consent_collection' => 'boolean',
    ];

    /** Label used in the activity log feed. */
    public function activityLabel(): string
    {
        return $this->full_legal_name ?? 'EOI submission';
    }
}
