<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name', 'description', 'type', 'event_code', 'date_from', 'date_to',
        'status', 'organizer_id', 'registration_link', 'notes', 'mode', 'location', 'banner_image',
        'form_fields',
    ];

    protected $casts = [
        'date_from'   => 'date',
        'date_to'     => 'date',
        // Per-event custom form schema. Null → fall back to DEFAULT_FIELDS.
        'form_fields' => 'array',
    ];

    /**
     * Canonical default field schema for the public registration form.
     * Used when `form_fields` is null and as the seed when the admin
     * opens the field builder for an event for the first time.
     *
     * Per-field shape:
     *   key         — snake_case unique within the form
     *   label       — UI label
     *   type        — text | email | tel | textarea | select | pills
     *   required    — must be filled to submit
     *   locked      — admin can't hide this field (first_name / last_name /
     *                 email / phone — needed for lead follow-up)
     *   default     — came from this canonical set (vs custom-added)
     *   enabled     — currently rendered on the public form
     *   placeholder — input placeholder text
     *   hint        — small helper text below the input
     *   options     — choices for type=select | pills
     *   section     — group heading on the form
     *   order       — display order within section
     */
    public const DEFAULT_FIELDS = [
        // Personal — first 4 are LOCKED (can't hide)
        ['key' => 'first_name',        'label' => 'First name',                'type' => 'text',     'required' => true, 'locked' => true,  'default' => true, 'enabled' => true, 'placeholder' => 'e.g. Maria',                  'section' => 'Personal information', 'order' => 1],
        ['key' => 'last_name',         'label' => 'Last name',                 'type' => 'text',     'required' => true, 'locked' => true,  'default' => true, 'enabled' => true, 'placeholder' => 'e.g. Santos',                 'section' => 'Personal information', 'order' => 2],
        ['key' => 'email',             'label' => 'Email address',             'type' => 'email',    'required' => true, 'locked' => true,  'default' => true, 'enabled' => true, 'placeholder' => 'you@example.com',             'section' => 'Personal information', 'order' => 3],
        ['key' => 'phone',             'label' => 'Phone number',              'type' => 'tel',      'required' => true, 'locked' => true,  'default' => true, 'enabled' => true, 'placeholder' => '+63 …',                       'section' => 'Personal information', 'order' => 4],
        ['key' => 'city',              'label' => 'City',                      'type' => 'text',     'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'placeholder' => 'e.g. Davao',                  'section' => 'Personal information', 'order' => 5],
        ['key' => 'country',           'label' => 'Country',                   'type' => 'text',     'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'placeholder' => 'e.g. Philippines',            'section' => 'Personal information', 'order' => 6],

        // Education — split out from Background so admins can drop
        // education-specific custom fields next to the existing ones
        // (e.g. school name, graduation year) without polluting the
        // employment block.
        ['key' => 'education_level',   'label' => 'Highest education level',   'type' => 'select',   'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'section' => 'Education', 'order' => 1,
            'options' => ['High School Graduate', 'Associate / Vocational', "Bachelor's Degree", "Master's Degree", 'Doctorate / PhD']],
        ['key' => 'field_of_study',    'label' => 'Field of study or profession', 'type' => 'text',  'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'placeholder' => 'e.g. Nursing, IT, Engineering','section' => 'Education', 'order' => 2],

        // Background (work / current status)
        ['key' => 'employment_status', 'label' => 'Employment status',         'type' => 'pills',    'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'section' => 'Background', 'order' => 1,
            'options' => ['Employed', 'Self-Employed', 'Unemployed', 'Student', 'OFW']],

        // Pathway
        ['key' => 'interest',          'label' => 'Pathway of interest',       'type' => 'select',   'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'section' => 'NZ pathway', 'order' => 1,
            'options' => ['Work Visa / Job Support', 'Student Visa', 'Skilled Migrant', 'Partner / Family Visa', 'Investor Visa', 'Not sure yet']],
        ['key' => 'planning_timeline', 'label' => 'Planning timeline',         'type' => 'select',   'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'section' => 'NZ pathway', 'order' => 2,
            'options' => ['Within 3 months', '3–6 months', '6–12 months', '1–2 years', 'Just exploring']],
        ['key' => 'funding_source',    'label' => 'How will you fund your move?', 'type' => 'pills', 'required' => true, 'locked' => false, 'default' => true, 'enabled' => true, 'section' => 'NZ pathway', 'order' => 3,
            'options' => ['Personal Savings', 'Family Support', 'Scholarship', 'Student Loan', 'Employer-Sponsored', 'Not yet decided']],

        // Free text
        ['key' => 'remarks',           'label' => 'Questions or goals',        'type' => 'textarea', 'required' => false,'locked' => false, 'default' => true, 'enabled' => true, 'placeholder' => 'Anything specific you want addressed during the session…', 'section' => 'Anything else?', 'order' => 1],
    ];

    /**
     * Field types the form builder allows admins to use when adding
     * brand-new (custom) fields. Locked default fields can have other
     * types but new fields stick to this list.
     */
    public const CUSTOM_FIELD_TYPES = ['text', 'email', 'tel', 'textarea', 'select', 'pills'];

    /**
     * Always-locked field keys — even if the admin somehow strips them
     * from the saved schema, the registration form treats them as
     * required so lead follow-up never breaks.
     */
    public const LOCKED_KEYS = ['first_name', 'last_name', 'email', 'phone'];

    public function sessions()
    {
        return $this->hasMany(EventSession::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    /**
     * The effective field schema used to render and validate the public
     * registration form. Falls back to DEFAULT_FIELDS when `form_fields`
     * is null (un-customised event). Locked keys are merged in even
     * when missing from the saved schema so the form can never lose
     * the 4 fields the lead-follow-up flow depends on.
     */
    public function effectiveFields(): array
    {
        $custom = is_array($this->form_fields) && count($this->form_fields) > 0
            ? $this->form_fields
            : self::DEFAULT_FIELDS;

        // Ensure every LOCKED_KEYS entry is present — re-inject from
        // DEFAULT_FIELDS at the appropriate order if absent.
        $byKey = collect($custom)->keyBy('key');
        foreach (self::DEFAULT_FIELDS as $def) {
            if (in_array($def['key'], self::LOCKED_KEYS, true) && ! $byKey->has($def['key'])) {
                $byKey->put($def['key'], array_merge($def, ['locked' => true, 'enabled' => true]));
            }
        }

        // Normalise boolean-ish columns. The form-builder admin UI POSTs
        // booleans as 1/0 ints (because FormData turns true/false into the
        // strings "true"/"false" which Laravel's boolean rule rejects), so
        // round-tripping through the JSON column leaves them as ints. The
        // rest of the codebase expects real booleans for `enabled`,
        // `required`, `locked`, `default` — coerce here once at the
        // boundary instead of sprinkling filter_var() everywhere.
        return $byKey->values()->map(function ($f) {
            return array_merge($f, [
                'enabled'  => array_key_exists('enabled',  $f) ? filter_var($f['enabled'],  FILTER_VALIDATE_BOOLEAN) : true,
                'required' => array_key_exists('required', $f) ? filter_var($f['required'], FILTER_VALIDATE_BOOLEAN) : false,
                'locked'   => array_key_exists('locked',   $f) ? filter_var($f['locked'],   FILTER_VALIDATE_BOOLEAN) : false,
                'default'  => array_key_exists('default',  $f) ? filter_var($f['default'],  FILTER_VALIDATE_BOOLEAN) : false,
            ]);
        })->all();
    }
}
