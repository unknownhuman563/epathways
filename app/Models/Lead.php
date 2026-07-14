<?php

namespace App\Models;

use App\Observers\LeadObserver;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[ObservedBy([LeadObserver::class])]
class Lead extends Model
{
    use LogsActivity, SoftDeletes;

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
        'For Assessment',
        'Endorsed',
        'Agreement Sent',
        'Agreement Signed',
        'For Invoice',
        'Invoice Paid',
        'Visa Lodged',
        'Request for Information',
        'Approved in Principle',
        'Approved Visa',
        'Decline Visa',
    ];

    /**
     * Case priority levels, surfaced on the Cases board as a coloured
     * avatar — urgent (red, today), high (orange, this week), medium
     * (yellow, on track), low (green, no rush), done (completed).
     */
    public const IMMIGRATION_PRIORITIES = ['urgent', 'high', 'medium', 'low', 'done'];

    /**
     * Named people who can be assigned to a lead while it sits at a given
     * sub-stage. Free-text labels (not user FKs) — "DIY" is a handling mode,
     * not a person — surfaced as a dropdown beside the stage in the Students
     * dashboard + New Student modal. Stored on `english_assignee` /
     * `immigration_assignee`.
     */
    public const ENGLISH_STAGE_ASSIGNEES = ['Paula', 'Frank', 'DIY'];

    public const IMMIGRATION_STAGE_ASSIGNEES = ['Hendry', 'Tarun', 'Dev'];

    /**
     * Query scope — leads currently in the Immigration team's queue.
     * The two qualifying signals are:
     *   1. `is_immigration_case = true` — explicit "Convert to Immigration
     *      Case" action on the lead detail page.
     *   2. `education_stage` is one of the EDUCATION_STAGES_IMMIGRATION
     *      values — the Education team has handed the file across.
     *
     * `immigration_stage` is intentionally NOT a qualifying signal on its
     * own. Staff can set it from the Students dashboard purely as a
     * handoff-tracking note on a still-active student — treating that as
     * "now in Cases" pulled pure students (e.g. anyone Study=ACTIVE who
     * had their immigration_stage stamped for reference) into the
     * Immigration Cases list by mistake. The flag/handoff-stage above are
     * what determine queue membership.
     */
    public function scopeImmigrationCase($query)
    {
        return $query->where(function ($q) {
            $q->where('is_immigration_case', true)
                ->orWhereIn('education_stage', self::EDUCATION_STAGES_IMMIGRATION);
        });
    }

    /**
     * Query scope — leads that are still in the Sales pipeline. Any
     * lead that's been moved to another department (student / English
     * student / immigration case / accommodation client) drops out of
     * the leads-table view. Used by the admin + sales leads listings.
     */
    public function scopeInLeadPipeline($query)
    {
        return $query
            ->where('is_student', false)
            ->where('is_immigration_case', false)
            ->where('is_accommodation_client', false)
            ->where('is_english_student', false);
    }

    /**
     * Append a dated entry to the lead's status timeline. Callers mutate the
     * attribute here and persist with their own save(), so a single stage
     * update writes one history row. `at` is captured per change so the
     * Pipeline can show exactly when each status was reached, and `by_name`
     * snapshots the acting staff member.
     */
    public function pushStageHistory(string $department, ?string $stage, ?string $assignee = null): void
    {
        $history = $this->stage_history ?? [];
        $user = auth()->user();

        $history[] = [
            'department' => $department,
            'stage' => $stage,
            'assignee' => $assignee,
            'at' => now()->toIso8601String(),
            'by_id' => $user?->id,
            'by_name' => $user?->name,
        ];

        $this->stage_history = $history;
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
        'lead_id', 'tracking_code', 'first_name', 'middle_name', 'last_name', 'suffix', 'dob', 'other_names', 'email', 'phone', 'referral', 'school_id',
        'gender', 'marital_status', 'branch', 'stage', 'status', 'priority',
        'country_of_birth', 'place_of_birth', 'citizenship',
        'residence_city', 'residence_state', 'residence_country',
        'has_passport', 'passport_number', 'passport_expiry', 'passport_path',
        'terms_accepted', 'work_info', 'financial_info', 'gap_explanation',
        'education_notes', 'event_id', 'event_session_id', 'event_response',
        'event_notes', 'event_notes_updated_at', 'event_notes_updated_by',
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
        'hidden_track_documents',
        'section_verifications',
        // Student conversion flag
        'is_student', 'student_converted_at', 'student_converted_by',
        // Multi-service flags
        'is_immigration_case', 'immigration_converted_at', 'immigration_converted_by', 'assessment_id',
        'is_accommodation_client', 'accommodation_converted_at', 'accommodation_converted_by',
        'is_english_student', 'english_converted_at', 'english_converted_by',
        // Staff member responsible for this lead (drives assignment notifications)
        'assigned_to',
        // Recruiting Agent (role='agent') who added this lead. Scopes the
        // Agent portal to its own leads + surfaces on the Sales Agents tab.
        'agent_id',
        // Last time the lead opened their /track/{code} page
        'last_seen_at',
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
        // Last stage movement — used by the Students / Cases tables'
        // "Updated [date] · Endorsed by [Name]" subtitle. Only touched by
        // stage-update + creation flows so the timestamp is a reliable
        // signal of actual pipeline movement.
        'stage_updated_at', 'stage_updated_by',
        // English / Immigration sub-stage tracks (see ENGLISH_STAGES,
        // IMMIGRATION_STAGES). Each carries an optional named assignee.
        'english_stage', 'english_assignee',
        'immigration_stage', 'immigration_priority', 'immigration_assignee',
        // Full dated timeline of every department status change — drives the
        // Pipeline "when did this status happen" view. See recordStageChange().
        'stage_history',

        // ── Wide profile-info build — columns surfaced by the
        //    LeadController::updatePersonal allow-list and rendered
        //    across the 9 editable Personal Info section cards. Grouped
        //    by card for readability. ─────────────────────────────────
        // 1. Personal identity (most existed; new = preferred_name,
        //    whatsapp, address lines + postcode, NZ continuous residence)
        'preferred_name', 'whatsapp',
        'residence_address_line_1', 'residence_address_line_2', 'residence_address_postcode',
        'has_been_in_nz_continuously', 'nz_continuous_residence_months',
        // 2. Passport (existing has_passport / passport_number /
        //    passport_expiry / passport_path stay)
        'passport_issuing_country', 'passport_issue_date',
        // 3. Current NZ visa (all new)
        'current_nz_visa_type', 'current_nz_visa_number',
        'current_nz_visa_issued_date', 'current_nz_visa_expiry_date',
        'previous_nz_visa_type',
        // 4. Study plans (flat columns alongside the related lead_study_plans
        //    table — legacy rows continue to flow through that relation)
        'preferred_course', 'preferred_qualification_level',
        'preferred_city_of_study', 'preferred_intake',
        'english_test_type', 'english_test_overall_score',
        'english_test_listening', 'english_test_reading',
        'english_test_writing', 'english_test_speaking',
        'english_test_date', 'target_institution',
        // 5. Financial
        'funding_source', 'estimated_total_cost_nzd', 'available_funds_nzd',
        'supports_partner_or_dependents', 'has_property_in_home_country',
        'annual_income_nzd', 'annual_income_currency', 'bank_funds_evidence_provided',
        // 6. Employment
        'employment_type', 'current_employer_name', 'current_position_title',
        'current_employer_country', 'current_employer_phone', 'current_employer_email',
        'current_employment_start_date',
        'current_salary_nzd', 'years_of_relevant_experience',
        'has_anzsco_listed_role', 'anzsco_code',
        'has_nz_professional_registration', 'nz_professional_registration_body',
        // 7. Education background
        'highest_qualification', 'highest_qualification_field',
        'highest_qualification_country', 'highest_qualification_year_completed',
        'has_nzqa_assessment', 'nzqa_assessment_level',
        // 8. Family
        'has_children', 'number_of_children', 'dependent_children_notes',
        'has_dependent_partner', 'partner_in_nz', 'intends_to_bring_family',
        // 9. Health & character
        'has_health_disclosure', 'health_disclosure_notes',
        'has_character_disclosure', 'character_disclosure_notes',
        'has_been_declined_visa', 'declined_visa_details',
        'has_criminal_record', 'criminal_record_details',
        'meets_184_day_rule_two_years',
    ];

    protected $casts = [
        'work_info' => 'array',
        'event_response' => 'array',
        'event_notes_updated_at' => 'datetime',
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
        'portal_invitation_approved_at' => 'datetime',
        'portal_invitation_expires_at' => 'datetime',
        'portal_invitation_accepted_at' => 'datetime',
        'date_of_first_contact' => 'date',
        'date_of_engagement' => 'date',
        'calendar_date' => 'date',
        'document_checklist' => 'array',
        'hidden_track_documents' => 'array',
        'section_verifications' => 'array',
        'agreements_acknowledged_at' => 'datetime',
        'stage_updated_at' => 'datetime',
        'stage_history' => 'array',
        'last_seen_at' => 'datetime',
        'is_student' => 'boolean',
        'student_converted_at' => 'datetime',
        'is_immigration_case' => 'boolean',
        'immigration_converted_at' => 'datetime',
        'is_accommodation_client' => 'boolean',
        'accommodation_converted_at' => 'datetime',
        'inz_lodged_at' => 'datetime',
        'inz_decision_at' => 'datetime',
        'services_agreement_signed_at' => 'datetime',

        // ── Wide profile-info build (column shapes match the
        //    widen_lead_personal_info_columns migration). ──────────────
        //    widen_lead_personal_info_columns migration). ──────────────
        'dob' => 'date',
        'passport_expiry' => 'date',
        'passport_issue_date' => 'date',
        'current_nz_visa_issued_date' => 'date',
        'current_nz_visa_expiry_date' => 'date',
        'current_employment_start_date' => 'date',
        'english_test_date' => 'date',
        // Encrypted at rest — Crypt::decryptString runs on read,
        // Crypt::encryptString on write. Existing plain-text passport
        // numbers were re-encrypted by the migration.
        'passport_number' => 'encrypted',
        'current_nz_visa_number' => 'encrypted',
        // Booleans (mirrors migration column types).
        'has_been_in_nz_continuously' => 'boolean',
        'meets_184_day_rule_two_years' => 'boolean',
        'has_passport' => 'boolean',
        'supports_partner_or_dependents' => 'boolean',
        'has_property_in_home_country' => 'boolean',
        'bank_funds_evidence_provided' => 'boolean',
        'has_anzsco_listed_role' => 'boolean',
        'has_nz_professional_registration' => 'boolean',
        'has_nzqa_assessment' => 'boolean',
        'has_children' => 'boolean',
        'has_dependent_partner' => 'boolean',
        'partner_in_nz' => 'boolean',
        'intends_to_bring_family' => 'boolean',
        'has_health_disclosure' => 'boolean',
        'has_character_disclosure' => 'boolean',
        'has_been_declined_visa' => 'boolean',
        'has_criminal_record' => 'boolean',
        // Numeric.
        'nz_continuous_residence_months' => 'integer',
        'years_of_relevant_experience' => 'integer',
        'highest_qualification_year_completed' => 'integer',
        'number_of_children' => 'integer',
        'estimated_total_cost_nzd' => 'decimal:2',
        'available_funds_nzd' => 'decimal:2',
        'annual_income_nzd' => 'decimal:2',
        'current_salary_nzd' => 'decimal:2',
        'english_test_overall_score' => 'decimal:2',
        'english_test_listening' => 'decimal:2',
        'english_test_reading' => 'decimal:2',
        'english_test_writing' => 'decimal:2',
        'english_test_speaking' => 'decimal:2',
    ];

    /**
     * Computed accessors serialised onto every Lead JSON payload. `age`
     * is derived from `dob` (see getAgeAttribute below) so the Personal
     * Information section on the lead detail page can display it
     * without an extra client-side calculation.
     */
    protected $appends = ['age'];

    /** Portal account (User row with role='lead'), if one exists. */
    public function portalUser()
    {
        return $this->hasOne(User::class, 'lead_id');
    }

    /** Staff member who flipped is_student=true (or null on legacy rows). */
    public function studentConverter()
    {
        return $this->belongsTo(User::class, 'student_converted_by');
    }

    /** Staff member who flipped is_immigration_case=true. */
    public function immigrationConverter()
    {
        return $this->belongsTo(User::class, 'immigration_converted_by');
    }

    /** Staff member who last moved the lead's stage in any department. */
    public function stageUpdater()
    {
        return $this->belongsTo(User::class, 'stage_updated_by');
    }

    /** Staff member this lead is currently assigned to (or null). */
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /** Recruiting Agent (role='agent') who added this lead, or null. */
    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    // ─── Computed accessors used by the Personal Info tab ─────────────

    /**
     * Age in whole years, derived from `dob`. Overrides the legacy `age`
     * column so the value can't drift out of sync with the date-of-birth
     * column the rest of the editing UI writes to. Returns null when DOB
     * is unset; falls back to whatever value sits in the legacy `age`
     * column so historical rows without DOB still show their imported age.
     */
    public function getAgeAttribute(): ?int
    {
        if (! empty($this->attributes['dob'])) {
            try {
                return \Illuminate\Support\Carbon::parse($this->attributes['dob'])->age;
            } catch (\Throwable $e) {
                // Bad date — fall through to legacy column.
            }
        }
        $legacy = $this->attributes['age'] ?? null;

        return $legacy !== null ? (int) $legacy : null;
    }

    /**
     * True for employment types that imply current paid work. Drives the
     * "current employer" sub-form revealed in the Employment section
     * card and the case-level filters on the Cases page.
     */
    public function getIsEmployedAttribute(): bool
    {
        return in_array($this->employment_type, ['Employed', 'Self-employed'], true);
    }

    /**
     * True when a current_nz_visa_type is populated — surfaces in the
     * /track page so the client sees their current visa status, and on
     * the Cases page summary chips.
     */
    public function getHasCurrentNzVisaAttribute(): bool
    {
        return ! empty($this->current_nz_visa_type);
    }

    /**
     * Whether the lead's passport_expiry sits within the supplied number
     * of days from today. Defaults to 180 days (Immigration NZ's six-
     * month rule). Property access `$lead->passport_expires_within_days`
     * uses the default; pass an explicit number to `getPassportExpiresWithinDaysAttribute`
     * for a different window.
     */
    public function getPassportExpiresWithinDaysAttribute(int $days = 180): bool
    {
        if (empty($this->attributes['passport_expiry'])) {
            return false;
        }
        try {
            $expiry = \Illuminate\Support\Carbon::parse($this->attributes['passport_expiry']);

            return $expiry->isFuture()
                && $expiry->diffInDays(\Illuminate\Support\Carbon::now()) <= $days;
        } catch (\Throwable $e) {
            return false;
        }
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

    /**
     * Managed agreements for this lead (Build 11.D Phase 2). Distinct from
     * documents — agreements have their own lifecycle (draft → sent → signed)
     * and the signing audit trail. The pre-existing AgreementGenerator
     * service writes generated PDFs as LeadDocument rows; that channel
     * still works and is unrelated.
     */
    public function agreements()
    {
        return $this->hasMany(\App\Models\Agreement::class);
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

    /** Staff member who last touched the event_notes field. */
    public function eventNotesEditor()
    {
        return $this->belongsTo(User::class, 'event_notes_updated_by');
    }

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function eventSession()
    {
        return $this->belongsTo(EventSession::class);
    }
}
