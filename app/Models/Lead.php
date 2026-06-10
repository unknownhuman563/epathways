<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use LogsActivity;

    /**
     * Education-team-specific lifecycle stages. Distinct from the global
     * pipeline below — these track the downstream Endorsement → Offer →
     * Visa → Enrolment flow that the Education portal owns once a lead is
     * converted to a student. Surfaced as the dropdown in the Students
     * dashboard's Status column.
     */
    public const EDUCATION_STAGES = [
        'Endorsed to School',
        'Conditional Offer',
        'Unconditional Offer',
        'Endorsed to Immigration',
        'Visa Lodged',
        'Approved in Principle',
        'Request for Information',
        'Approved Visa',
        'Started Course',
    ];

    /**
     * Subset of EDUCATION_STAGES that hand the lead off to the Immigration
     * team. Anyone at one of these stages is treated as an immigration
     * case for routing purposes — they appear on the Immigration
     * dashboard, the Cases list, and the Immigration tab of the Education
     * Students page, even if `is_immigration_case` hasn't been flipped
     * manually. Single source of truth — referenced by the model scope
     * below and by the Students.jsx tab routing.
     */
    public const EDUCATION_STAGES_IMMIGRATION = [
        'Endorsed to Immigration',
        'Visa Lodged',
        'Approved in Principle',
        'Request for Information',
        'Approved Visa',
    ];

    /**
     * English-team lifecycle. Tracks the PTE / DIY review and test-prep
     * flow. Setting `english_stage` to any of these routes the lead to
     * the English tab on the Education Students page.
     */
    public const ENGLISH_STAGES = [
        'PTE Review',
        'DIY Review',
        'For PTE Mocktest',
        'For PTE Exam',
    ];

    /**
     * Immigration-team lifecycle. Tracks the case from initial endorsement
     * through INZ outcome. Setting `immigration_stage` to any of these
     * routes the lead to the Immigration tab.
     */
    public const IMMIGRATION_STAGES = [
        'Endorsed',
        'Visa Lodged',
        'Request for Information',
        'Approved in Principle',
        'Approved Visa',
        'Decline Visa',
    ];

    /**
     * Query scope — leads currently in the Immigration team's queue.
     * Either explicitly converted via "Convert to Immigration Case" (the
     * `is_immigration_case` flag), at one of the immigration handoff
     * education_stage values, OR with an immigration_stage set.
     */
    public function scopeImmigrationCase($query)
    {
        return $query->where(function ($q) {
            $q->where('is_immigration_case', true)
              ->orWhereIn('education_stage', self::EDUCATION_STAGES_IMMIGRATION)
              ->orWhereNotNull('immigration_stage');
        });
    }

    /**
     * Canonical lead-pipeline stages. Single source of truth — referenced
     * by SalesController validation and the LeadController stage-update
     * endpoint. Order is the canonical pipeline order surfaced in the UI.
     */
    public const STAGES = [
        'New Leads',
        'Contact Attempted',
        'Contacted for Booking',
        'Booking Confirmation with Bryll',
        'Missed the Meeting',
        'Qualified but Not Ready',
        'Qualified but No Funds',
        'Qualified',
        'Booked Consultation',
        'Did Not Book Consultation',
        'No Show',
        'Consultation Done',
        'Proposal Sent',
        'Consultancy Agreement',
        'English Pro',
        'School Enrollment',
        'Visa Process',
        'Not Qualified',
        'Work Pathway / Other',
    ];

    protected $fillable = [
        'lead_id', 'tracking_code', 'first_name', 'middle_name', 'last_name', 'dob', 'other_names', 'email', 'phone',
        'gender', 'marital_status', 'branch', 'stage', 'status',
        'country_of_birth', 'place_of_birth', 'citizenship',
        'residence_city', 'residence_state', 'residence_country',
        'has_passport', 'passport_number', 'passport_expiry', 'passport_path',
        'terms_accepted', 'work_info', 'financial_info', 'gap_explanation',
        'education_notes', 'event_id', 'event_session_id',
        'immigration_info', 'character_info', 'health_info', 'family_info',
        'nz_contacts_info', 'military_info', 'source_of_funds_info',
        'home_ties_info', 'declaration_accepted',
        'ai_analysis', 'ai_analysis_status',
        'source',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        // Lead Portal invitation lifecycle
        'portal_invitation_status',
        'portal_invitation_requested_by', 'portal_invitation_requested_at',
        'portal_invitation_approved_by',  'portal_invitation_approved_at',
        'portal_invitation_token', 'portal_invitation_expires_at',
        'portal_invitation_accepted_at',
        // Journey panel — pre-screening + goal-setting captures
        'date_of_first_contact', 'date_of_engagement',
        'prescreened_by', 'prescreened_notes',
        'goal_setting_status', 'goal_setting_by', 'goal_setting_notes',
        // Sales-dashboard mirror columns
        'calendar_date', 'client_info_link', 'call_update_form_link',
        'document_checklist',
        'section_verifications',
        // Student conversion flag
        'is_student', 'student_converted_at', 'student_converted_by',
        // Multi-service flags
        'is_immigration_case', 'immigration_converted_at', 'immigration_converted_by',
        'is_accommodation_client', 'accommodation_converted_at', 'accommodation_converted_by',
        // INZ lodgement tracking
        'inz_visa_type', 'inz_lodged_at', 'inz_reference', 'inz_status', 'inz_decision_at',
        // IAA / Privacy Act gating
        'services_agreement_signed_at',
        // Lead-portal acknowledgment of Consultancy + English Engagement
        'agreements_acknowledged_at',
        // Students Dashboard mirror (Education team's spreadsheet columns
        // that don't already live elsewhere on the lead row).
        'student_payment', 'student_school', 'student_coop', 'student_oop',
        'student_gdrive_link', 'student_comments',
        // Education-team-specific lifecycle stage (see EDUCATION_STAGES).
        'education_stage',
        // English / Immigration sub-stage tracks (see ENGLISH_STAGES,
        // IMMIGRATION_STAGES).
        'english_stage', 'immigration_stage',
    ];

    protected $casts = [
        'work_info' => 'array',
        'financial_info' => 'array',
        'education_notes' => 'array',
        'immigration_info' => 'array',
        'character_info' => 'array',
        'health_info' => 'array',
        'family_info' => 'array',
        'nz_contacts_info' => 'array',
        'military_info' => 'array',
        'source_of_funds_info' => 'array',
        'home_ties_info' => 'array',
        'ai_analysis' => 'array',
        'age' => 'integer',
        'portal_invitation_requested_at' => 'datetime',
        'portal_invitation_approved_at'  => 'datetime',
        'portal_invitation_expires_at'   => 'datetime',
        'portal_invitation_accepted_at'  => 'datetime',
        'date_of_first_contact'          => 'date',
        'date_of_engagement'             => 'date',
        'calendar_date'                  => 'date',
        'document_checklist'             => 'array',
        'section_verifications'          => 'array',
        'agreements_acknowledged_at'     => 'datetime',
        'is_student'                     => 'boolean',
        'student_converted_at'           => 'datetime',
        'is_immigration_case'            => 'boolean',
        'immigration_converted_at'       => 'datetime',
        'is_accommodation_client'        => 'boolean',
        'accommodation_converted_at'     => 'datetime',
        'inz_lodged_at'                  => 'datetime',
        'inz_decision_at'                => 'datetime',
        'services_agreement_signed_at'   => 'datetime',
    ];

    /** Portal account (User row with role='lead'), if one exists. */
    public function portalUser()
    {
        return $this->hasOne(User::class, 'lead_id');
    }

    /**
     * Generate a short, customer-friendly tracking code that is guaranteed
     * unique against the leads table. Ambiguous characters (0/O, 1/I/L) are
     * stripped so codes can be read aloud or texted without confusion.
     *
     * Format: "EP-XXXXXXXX" (8 alphanumerics, ~30 bits of entropy — large
     * enough that a malicious enumerator can't realistically harvest live
     * codes against the rate-limited public lookup endpoint).
     */
    public static function generateTrackingCode(): string
    {
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        do {
            $body = '';
            for ($i = 0; $i < 8; $i++) {
                $body .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
            $code = 'EP-'.$body;
        } while (static::where('tracking_code', $code)->exists());

        return $code;
    }

    /**
     * Boot hook: every new lead gets a tracking_code automatically. We
     * only generate one if the caller hasn't provided one (so seeders and
     * the backfill migration can pass their own).
     */
    protected static function booted(): void
    {
        static::creating(function (Lead $lead) {
            if (empty($lead->tracking_code)) {
                $lead->tracking_code = static::generateTrackingCode();
            }
        });
    }

    public function documentRequests()
    {
        return $this->hasMany(LeadDocumentRequest::class);
    }

    public function tags()
    {
        return $this->belongsToMany(LeadTag::class, 'lead_tag_lead')
            ->withTimestamps()
            ->withPivot('user_id');
    }

    public function notes()
    {
        return $this->hasMany(LeadNote::class);
    }

    public function tasks()
    {
        return $this->hasMany(LeadTask::class);
    }

    public function documents()
    {
        return $this->hasMany(LeadDocument::class);
    }

    /** AI analysis is written by a background job — don't log it as a user edit. */
    public function activityIgnoredAttributes(): array
    {
        return ['ai_analysis', 'ai_analysis_status'];
    }

    public function educationExps(): HasMany
    {
        return $this->hasMany(LeadEducationExp::class);
    }
    
    public function studyPlans(): HasMany
    {
        return $this->hasMany(LeadStudyPlan::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    
    public function eventSession()
    {
        return $this->belongsTo(EventSession::class);
    }
}
