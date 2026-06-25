# Visa Assessment + Case Detail Deep-Dive Audit

**Date:** 2026-06-22
**Branch:** `angi`
**Scope:** The "visa assessment" submission + triage surfaces (public intakes, the immigration portal's Assessments queue, the per-intake detail pages, the ResidentIntake detail page) and the "case detail" surface (`/portal/immigration/leads/{id}`, the shared `LeadDetails.jsx` component). Investigation only — no code changed.
**Method:** `php artisan route:list --path={immigration,assessment,intake,leads,interest}`, read `routes/web.php`, `LeadController`, `Portal\ImmigrationController`, `ResidentIntakeController`, `WorkIntakeController`, `StudentIntakeController`, `VisitorIntakeController`, `AssessmentController`, the `Lead` / `Assessment` / `*Intake` models, the four `*_intakes` migrations + the `assessments` table migration, the React pages under `resources/js/pages/portal/immigration/`, `pages/admin/LeadDetails.jsx`, and the existing Feature tests for the immigration + lead surfaces.

Status legend: ✅ works · ⚠️ partial · ❌ missing · 🔓 security/privacy note

---

## TL;DR (read this first)

- There is **no `VisaAssessment` model and no `visa_assessments` table.** "Visa assessment" is a colloquial label that, in practice, maps to **one of four intake tables** (`resident_intakes`, `work_intakes`, `student_intakes`, `visitor_intakes`) plus a polymorphic [`Assessment`](../../app/Models/Assessment.php) row that wraps them with the Pay→Book funnel.
- There are **two completely separate "visa assessment" funnels** with different data shapes and different controllers:
  1. **Public visa-interest forms** (4 intake tables, the immigration team's "Assessments" queue) — driven by `*IntakeController@store` + `Assessment::createForIntake`. No `Lead` row is created at submission time.
  2. **Free Assessment / Education Enrolment** (`/free-assessment`, `/education-enrolment`) — writes straight to the `leads` table with the entire payload in `leads.ai_analysis` JSON and queues `AnalyzeLeadAssessment`. **No intake row created.** This funnel is **not** surfaced on the immigration Assessments queue; the education + sales portals consume it.
- The **case detail page** is the shared [`admin/LeadDetails.jsx`](../../resources/js/pages/admin/LeadDetails.jsx) component, served by `LeadController::show` under whatever URL prefix the staffer came in via (`/admin/leads/{id}`, `/portal/immigration/leads/{id}`, `/portal/sales/leads/{id}`, etc.) — the page name is rewritten per prefix so the right portal layout wraps. **No dedicated "Case" page exists.** Build 10's `<CaseHealthBadge />` ([`LeadDetails.jsx:372`](../../resources/js/pages/admin/LeadDetails.jsx#L372)) renders only when `backendLead.is_immigration_case` is true.
- The **lead→case conversion** is a one-field flip ([`LeadController::convertToCase` L1685-L1700](../../app/Http/Controllers/LeadController.php#L1685)) plus three stamp columns plus a department notification. **Nothing on the leads table is copied or transformed.** No intake row is created. Documents/notes/tasks aren't touched.
- The **assessment→case conversion** ([`ImmigrationController::convertAssessmentToCase` L417-L516](../../app/Http/Controllers/Portal/ImmigrationController.php#L417)) goes much further: it **creates or matches a Lead by email**, snapshots ~10 fields from the intake into the Lead, flips `is_immigration_case = true`, sets the intake's `status = 'Engaged'`, sets the Assessment's `status = 'completed'`, and redirects to `/portal/immigration/leads/{lead->id}?tab=documents`.
- The two origins therefore produce a Lead with **completely different field coverage**. A sales-converted case has whatever the sales lead row contained (often sparse). An assessment-converted case has the intake snapshot copied in plus the full intake row reachable via `Assessment::intakeable()`.
- The unification work needs to handle: (a) "case has linked Assessment + intake" → surface the intake's deep questionnaire data, (b) "case has linked free-assessment payload in `ai_analysis` JSON" → surface that, (c) "case has neither" → render gracefully on lead row fields alone.

---

## Section 1 — Visa Assessment page: where it lives

### 1a. The "queue" page (the triage list)

| Question | Finding |
|---|---|
| URL | `GET /portal/immigration/assessments` |
| Route name | `portal.immigration.assessments` |
| Controller method | [`Portal\ImmigrationController::assessments`](../../app/Http/Controllers/Portal/ImmigrationController.php#L568) |
| React component | [`portal/immigration/Assessments.jsx`](../../resources/js/pages/portal/immigration/Assessments.jsx) |
| Middleware chain | `auth` (global wrapper [`routes/web.php:201`](../../routes/web.php#L201)) → `portal` prefix ([L566](../../routes/web.php#L566)) → `portal:immigration` ([L691](../../routes/web.php#L691)) |
| Who can access | Anyone with `role = 'immigration'`. Per [`User::canAccessPortal`](../../app/Models/User.php), admins (`is_admin()`) and super-admins satisfy every `portal:*` check, so `admin` + `super_admin` both reach it too. Immigration sub-roles (`immigration_manager`, `immigration_adviser`) **do not** satisfy `portal:immigration` directly — `canAccessPortal('immigration')` short-circuits to `true` only for the `IMMIGRATION_ROLES` constant on the literal `'immigration'` portal name. |
| Page title rendered | `Visa Assessment` ([`Assessments.jsx:114-119`](../../resources/js/pages/portal/immigration/Assessments.jsx#L114)) |

### 1b. The per-intake detail page (the "profile")

Two physical pages serve this — Resident has its own legacy URL, Work/Student/Visitor share the unified detail page.

| Visa type | URL | Controller method | React component (auto-wrap layout) |
|---|---|---|---|
| Resident | `GET /admin/immigration/resident-intakes/{id}` ([web.php:534](../../routes/web.php#L534)) | [`ResidentIntakeController::adminShow`](../../app/Http/Controllers/ResidentIntakeController.php#L300) | [`admin/immigration/ResidentIntakeDetails.jsx`](../../resources/js/pages/admin/immigration/ResidentIntakeDetails.jsx) — **one-line re-export** of `pages/portal/immigration/IntakeDetails.jsx`. Page name `admin/immigration/ResidentIntakeDetails` → auto-wrapped in `AdminLayout`. |
| Work / Student / Visitor | `GET /portal/immigration/intakes/{type}/{id}` ([web.php:704-706](../../routes/web.php#L704)) — `{type}` constrained to `work\|student\|visitor`, `{id}` to `[0-9]+` | [`Portal\ImmigrationController::showIntake`](../../app/Http/Controllers/Portal/ImmigrationController.php#L273-L344) (estimated) | [`portal/immigration/IntakeDetails.jsx`](../../resources/js/pages/portal/immigration/IntakeDetails.jsx). Page name starts with `portal/immigration/` → auto-wrapped in `ImmigrationLayout`. |

Middleware: Resident → `portal:admin,immigration` group ([web.php:532](../../routes/web.php#L532)); Work/Student/Visitor → `portal:immigration` group ([web.php:691](../../routes/web.php#L691)). Both effectively let admins, super-admins, and the immigration role through.

🔓 **Same component, two layouts.** `admin/immigration/ResidentIntakeDetails.jsx` re-exports the unified `IntakeDetails` so both URLs share rendering logic, but the page-name prefix routes the chrome (`AdminLayout` for `/admin/...`, `ImmigrationLayout` for `/portal/immigration/...`). This matters for the unification: the same "profile" component is already designed to render under either layout.

### 1c. The legacy admin Resident-intake **index**

`GET /admin/immigration/resident-intakes` ([web.php:533](../../routes/web.php#L533)) → `ResidentIntakeController::adminIndex` → `pages/admin/immigration/ResidentIntakes.jsx`. **Resident-only** list. The unified queue at `/portal/immigration/assessments` covers all four types and is the canonical entry now — this admin list is the older, narrower view kept around because the Resident detail URL still lives under `/admin/...`.

---

## Section 2 — Visa Assessment data structure

### 2a. The five tables

There is no single "visa_assessments" table. The data is split across:

| Table | Purpose | Migration |
|---|---|---|
| `resident_intakes` | Resident Visa (Skilled Migrant Category) form data — Ergo employment + qualifications profile | [`2026_05_11_120000_create_resident_intakes_table.php`](../../database/migrations/2026_05_11_120000_create_resident_intakes_table.php) (+ 4 follow-ups for conditional fields, family, document files, edit token) |
| `work_intakes` | AEWV applicant form — Sections A–L from the 2026 AEWV PDF | [`2026_06_02_160000_create_work_intakes_table.php`](../../database/migrations/2026_06_02_160000_create_work_intakes_table.php) |
| `student_intakes` | Student Visa (SV) form — Sections A–M from the 2026 SV PDF | [`2026_06_02_160100_create_student_intakes_table.php`](../../database/migrations/2026_06_02_160100_create_student_intakes_table.php) |
| `visitor_intakes` | General Visitor Visa (GVV) form — Sections A–M from the 2025 GVV PDF | [`2026_06_02_160200_create_visitor_intakes_table.php`](../../database/migrations/2026_06_02_160200_create_visitor_intakes_table.php) |
| `assessments` | Polymorphic Pay→Book wrapper that points at one of the four intake rows | [`2026_06_02_130000_create_assessments_table.php`](../../database/migrations/2026_06_02_130000_create_assessments_table.php) |

Also relevant (the "other" visa-assessment funnel that doesn't touch these tables):

| Table | Purpose |
|---|---|
| `leads` (column `ai_analysis` JSON, columns `terms_accepted`, `immigration_info`, `character_info`, `health_info`, `family_info`, `nz_contacts_info`, `military_info`, `source_of_funds_info`, `home_ties_info`, `work_info`, `financial_info`, `education_notes`) | Where the **Free Assessment** + **Education Enrolment** funnels write. The full payload goes into `ai_analysis` as JSON; the dedicated `*_info` columns hold the structured pieces. See [`add_complete_assessment_fields_to_leads_table.php`](../../database/migrations/2026_04_07_000001_add_complete_assessment_fields_to_leads_table.php). |
| `lead_education_exps` | One row per education entry on a free-assessment submission. |
| `lead_study_plans` | One row per study plan on a free-assessment submission. |

### 2b. Relationship to `leads`

- **`*_intakes` tables**: no FK to `leads`. Email is the only join key (matched lazily by `Portal\ImmigrationController::assessments` to derive `caseEmails` via `Lead::where('is_immigration_case', true)` [L588-L593](../../app/Http/Controllers/Portal/ImmigrationController.php#L588)).
- **`assessments`**: `intakeable_type` + `intakeable_id` polymorphic morph to whichever `*_intakes` row was filled, **no FK to leads**, but has `applicant_email` for matching.
- **Free-Assessment / Education-Enrolment**: writes directly into the existing `leads` row; no separate child table other than `lead_education_exps` / `lead_study_plans`.

So **the assessment data is in a separate table when the source is a public visa-interest form, and on the leads table itself when the source is the inline Free Assessment**.

### 2c. Column inventory

#### `assessments` (polymorphic wrapper — 14 columns)

| Column | Type | Notes |
|---|---|---|
| `id`, `token` (unique, 64 chars), `visa_type_id` (FK), `intakeable_type`, `intakeable_id` (polymorphic) | identifiers |
| `applicant_first_name`, `applicant_last_name`, `applicant_email` (indexed), `applicant_phone`, `applicant_country` | snapshot of identity at submit time |
| `locked_price_nzd`, `locked_price_at`, `locked_price_expires_at` | 30-day price lock for the Pay step |
| `payment_status` (`pending` / `paid` / `failed`, default `pending`, indexed), `payment_session_id`, `payment_amount_cents`, `payment_currency`, `paid_at` | Stripe surface — **dormant** (see [`AssessmentController::simulatePay`](../../app/Http/Controllers/AssessmentController.php) comment in Section 3) |
| `booking_id` (nullable FK to `bookings`) | linked consultation booking |
| `status` (default `submitted`, indexed) | lifecycle: `draft → submitted → paid → booked → completed / cancelled` |

#### `resident_intakes` (~30 columns, no JSON sections)

Categories: Personal (first/last/dob/nationality/email/phone), Passport (number/expiry/issuing country), Visa (current type + other + expiry + arrival date + previous history), Employment-at-Ergo (job_title, employment_start, employment_type, hourly_rate), Qualifications (highest, institution, country, nzqa_status), Experience (NZ skilled years, total skilled years, career summary), English (evidence), Family (include_family flag), Documents JSON (checkbox state), Disclosures (character/health, other notes), `status` (default `New`), `edit_token` (added in [2026_05_13_140000](../../database/migrations/2026_05_13_140000_add_edit_token_to_resident_intakes_table.php)), `document_files` JSON, conditional fields (added in [2026_05_11_140000](../../database/migrations/2026_05_11_140000_add_conditional_fields_to_resident_intakes_table.php)), `family_members` JSON (added in [2026_05_11_160000](../../database/migrations/2026_05_11_160000_add_family_members_to_resident_intakes_table.php)).

#### `work_intakes` (~70 columns, organised into 12 sections A–L)

Each section maps 1-to-1 with a section of the AEWV PDF: Identity (A), NZ Immigration History (B), NZ Employer (C), Character (D), Health (E), Current Employment (F), Previous Roles (G — JSON), Family (H — JSON), NZ Contacts (I — JSON), Military (J), Travel (K — JSON), Declaration (L). `family_members`, `nz_contacts`, `previous_roles`, `travel_trips` are all stored as JSON arrays so the form can carry repeating sub-records without joins.

#### `student_intakes` (~80 columns, sections A–M)

Adds vs. work: `passport_number` + `passport_expiry` on the row, `overseas_address`, a full **Study Plan** section (`programmes`, `study_period_from/to`, `school_name`, `has_offer`), a **Study Funds & Assets** section (`tuition_fee_nzd`, `available_funds` JSON, `living_expenses_nzd`, `has_sponsor`, `sponsor_relationship`, `sponsor_income_source`, `can_provide_statements`, `has_other_assets`, `other_assets_details`), and a `qualifications` JSON array.

#### `visitor_intakes` (~70 columns, sections A–M)

Visitor-specific: `town_city` / `region` / `postcode` for the address, `previous_xray` / `previous_inz1007` / `inz_requested_medical` / `previous_police_certificate` for medical-history gates, single highest-qualification fields (no JSON), **Travel Plan** section (`purpose_of_visit`, `intended_stay_length`, `intended_from`/`to`, `multi_entry_plans`, `has_leave_permit`), and **Travel Funds & Assets** (description text + `can_provide_statements`, `has_other_assets`).

#### `leads` — assessment-relevant columns (free-assessment funnel)

`ai_analysis` (JSON, full free-assessment payload), `ai_analysis_status` (`processing` / `completed` / `failed`), `terms_accepted` (bool), `gap_explanation`, `education_notes` (JSON), `work_info` (JSON), `financial_info` (JSON), `immigration_info` (JSON), `character_info` (JSON), `health_info` (JSON), `family_info` (JSON), `nz_contacts_info` (JSON), `military_info` (JSON), `source_of_funds_info` (JSON), `home_ties_info` (JSON), `declaration_accepted`, plus per-section passport / current-NZ-visa fields added by [`add_complete_assessment_fields_to_leads_table.php`](../../database/migrations/2026_04_07_000001_add_complete_assessment_fields_to_leads_table.php).

### 2d. Encryption + sensitive fields

| Field | Where | Protection |
|---|---|---|
| `leads.passport_number` | `Lead` model cast `'passport_number' => 'encrypted'` ([`Lead.php:301`](../../app/Models/Lead.php#L301)) | Laravel `Crypt::encryptString` on write. Test `test_05_passport_number_is_encrypted_at_rest` ([Lead/PersonalProfileTest L143](../../tests/Feature/Lead/PersonalProfileTest.php#L143)) verifies the column is encrypted at rest. |
| `leads.current_nz_visa_number` | same cast ([Lead.php:302](../../app/Models/Lead.php#L302)) | Same. |
| `resident_intakes.passport_number` / `student_intakes.passport_number` / `visitor_intakes.passport_number` | plain string column on each intake table | ❌ **Not encrypted at rest.** Only the `Lead` model's passport column gets the encrypted cast. |
| `dob` | plain date on all 4 intakes + leads | Stored as `date` cast; not encrypted. |
| `national_id` | plain string on work/student/visitor | Not encrypted. |
| Financial fields (`hourly_rate`, `tuition_fee_nzd`, `living_expenses_nzd`, `available_funds`) | plain decimal/JSON on the relevant intakes | Not encrypted. |
| `assessments.payment_session_id`, `paid_at`, `payment_amount_cents` | plain on `assessments` | Stripe surface is dormant; no live PCI data currently flows here. |
| Document files | `resident_intakes.document_files` JSON holds paths under `Storage::disk('local')` ([`ResidentIntakeController::downloadDocument` L315-L340](../../app/Http/Controllers/ResidentIntakeController.php#L315)) | Files served only to staff via the gated `/admin/immigration/resident-intakes/{id}/documents/{key}/{index?}` route. |

🔓 **Inconsistency to flag:** when an intake row is converted to a case the converter copies `passport_number` into `leads.passport_number` ([ImmigrationController::convertAssessmentToCase L479](../../app/Http/Controllers/Portal/ImmigrationController.php#L479)). The destination column is encrypted; the source column on the intake row is not. The plaintext still lives on the intake table after the copy.

🔓 **Case-view audit log:** [`CaseAuditView`](../../app/Models/CaseAuditView.php) row is written on every immigration-case view by staff ([LeadController::show L643-L658](../../app/Http/Controllers/LeadController.php#L643)) — Privacy Act 2020 read trail. **Resident/Work/Student/Visitor intake detail-page views are NOT audited.** Only the Case Detail (`/portal/immigration/leads/{id}`) writes a `CaseAuditView`.

---

## Section 3 — Visa Assessment intake flow

### 3a. The public visa-interest forms (4 paths)

| Visa | Public URL | GET → page | POST → controller |
|---|---|---|---|
| Resident | `/resident-interest` ([web.php:108-109](../../routes/web.php#L108)) | `ResidentIntakeController::showForm` | [`ResidentIntakeController::store` L137-L195](../../app/Http/Controllers/ResidentIntakeController.php#L137) |
| Work | `/work-interest` ([web.php:114-115](../../routes/web.php#L114)) | `WorkIntakeController::showForm` | [`WorkIntakeController::store` L24+](../../app/Http/Controllers/WorkIntakeController.php#L24) |
| Student | `/student-interest` ([web.php:116-117](../../routes/web.php#L116)) | `StudentIntakeController::showForm` | [`StudentIntakeController::store` L20+](../../app/Http/Controllers/StudentIntakeController.php#L20) |
| Visitor | `/visitor-interest` ([web.php:118-119](../../routes/web.php#L118)) | `VisitorIntakeController::showForm` | [`VisitorIntakeController::store` L20+](../../app/Http/Controllers/VisitorIntakeController.php#L20) |

**All four are public** (no auth middleware). The forms are reachable via the `VisaAssessmentSection` cards on the public immigration landing page.

**Token-edit links** exist for Resident (`/resident-interest/edit/{token}` [web.php:122-123](../../routes/web.php#L122)). The other three intake models have an `edit_token` column but no edit route is wired yet.

### 3b. What `store` creates

From [`ResidentIntakeController::store` L150-L184](../../app/Http/Controllers/ResidentIntakeController.php#L150):

```php
DB::beginTransaction();
$intakeId = 'RI-' . strtoupper(uniqid());
[$storedFiles, $documents] = $this->persistUploadedFiles(...);
$intake = ResidentIntake::create(array_merge($validated, [
    'intake_id' => $intakeId, 'status' => 'Submitted',
    'documents' => $documents ?: null, 'document_files' => $storedFiles ?: null,
]));
// Tracking-only Assessment row
$visaType = IntakeVisaTypeMap::resolve(ResidentIntake::class);
if ($visaType) Assessment::createForIntake($intake, $visaType);
DB::commit();
```

So `store()` creates:

1. **One `*_intakes` row** with `status = 'Submitted'`.
2. **One `assessments` row** via [`Assessment::createForIntake`](../../app/Models/Assessment.php#L120-L159) — polymorphic `intakeable_*` → the new intake, snapshot of identity, `status = 'submitted'`, `payment_status = 'pending'`, current visa-type price locked for 30 days.

**No `Lead` row is created.** The intake stays "unmatched" until either (a) `Portal\ImmigrationController::convertAssessmentToCase` is called from the Assessments queue's Convert button, or (b) a staffer manually creates a case via `/portal/immigration/cases` → `storeCase`.

**No notification, no AI dispatch, no email to staff** at submit time. The intake just shows up in the next page-load of `/portal/immigration/assessments`.

⚠️ **Failure mode:** if `IntakeVisaTypeMap::resolve()` returns null (visa-type catalog row missing) the intake still saves; only the `Assessment` is skipped (with a `Log::warning`). That intake will then have no `Convert` button on the Assessments queue (the button is gated on `hasAssessment` — [ImmigrationController::assessments L632](../../app/Http/Controllers/Portal/ImmigrationController.php#L632)). A backfill command exists for this case (Section 10).

### 3c. The Free Assessment funnel (the other "visa assessment")

| URL | Controller method | Effect |
|---|---|---|
| GET `/free-assessment` | [`LeadController::showFreeAssessment` L87-L100](../../app/Http/Controllers/LeadController.php#L87) | Renders `free-assessment/FreeAssessmentPage`. Passes program catalogue. |
| GET `/education-enrolment` | [`LeadController::showEducationEnrolment` L106-L119](../../app/Http/Controllers/LeadController.php#L106) | Renders `free-assessment/EducationEnrolmentPage`. |
| POST `/free-assessment/draft` | [`LeadController::saveAssessmentDraft` L130-L212](../../app/Http/Controllers/LeadController.php#L130) | Dedupes by email via `LeadIntakeService::ingest`, writes the form payload into `leads.ai_analysis` JSON + flips `status` to `Draft` (unless already `Submitted`/`Engaged`/etc.), `source = free-assessment` or `education-enrolment`. **No intake row.** Returns JSON for XHR auto-save. |
| POST `/free-assessment` | [`LeadController::storeFreeAssessment` L330+](../../app/Http/Controllers/LeadController.php#L330) | Full validation (Steps 1–13). Dedupes by email. `lead_id = 'FA-...'` (or `EE-...` for enrolment). Writes the structured `*_info` JSON columns + `ai_analysis`. Flips `status` to `Submitted`, `stage` to `Evaluation`. Stores up to 10 PDFs per `cv_files` / `passport_files` / `diploma_files` / `transcript_files` field under `enrolment-docs/{lead_id}/{folder}`. Dispatches `AnalyzeLeadAssessment::dispatch($lead)` ([L599](../../app/Http/Controllers/LeadController.php#L599)). |
| GET `/assessment-result/{lead_id}` | [`LeadController::showAssessmentResult` L618](../../app/Http/Controllers/LeadController.php#L618) | Public result page (the AI summary the applicant sees after submit). |

🔓 The Free Assessment funnel **does NOT surface on `/portal/immigration/assessments`** — that page reads only the four `*_intakes` tables. The Free-Assessment leads land on the education + sales portals' Assessments queues (`Portal\EducationController::assessments`, `Portal\SalesController::assessments`).

### 3d. Post-submission triggers

| Funnel | Trigger fires? |
|---|---|
| Public visa-interest forms (4 paths) | ❌ No notification. ❌ No email. ❌ No AI dispatch. Only the DB write + tracking-only Assessment row. |
| Free Assessment / Education Enrolment | ✅ `AnalyzeLeadAssessment` queued ([LeadController L599](../../app/Http/Controllers/LeadController.php#L599)) → uses `CerebrasService` (per CLAUDE.md) to write a JSON eligibility score into `leads.ai_analysis`. Drives the `<LeadHealthBadge />` on the lead detail. No staff email. |

---

## Section 4 — Current Case Detail page

| Question | Finding |
|---|---|
| Clicking a case from `/portal/immigration/cases` lands on… | `GET /portal/immigration/leads/{id}` ([web.php:697](../../routes/web.php#L697)) → `LeadController::show` |
| Which component? | **`admin/LeadDetails.jsx`** — shared. `LeadController::show` resolves the URL prefix and rewrites the Inertia page name ([LeadController L686-L690](../../app/Http/Controllers/LeadController.php#L686)): the immigration prefix renders `portal/immigration/LeadDetails`, which is a re-export of `admin/LeadDetails`. So Inertia auto-wraps it in `ImmigrationLayout` while the rendering logic is the admin component. |
| Route URL pattern | `/portal/immigration/leads/{id}` (immigration portal entry), or the same `LeadController::show` reachable via `/admin/leads/{id}`, `/portal/sales/leads/{id}`, etc. |
| Controller method | [`LeadController::show($id)` L633-L690+](../../app/Http/Controllers/LeadController.php#L633) — accepts numeric `id` OR `lead_id` string ("LP-12345" / "IC-..." / "FA-..."). |
| Middleware | The immigration variant is inside `Route::middleware('portal:immigration')->prefix('immigration')` ([web.php:691](../../routes/web.php#L691)). Other portal prefixes have their own groups. |
| Is the Case Health Badge visible? | ✅ Yes. [`admin/LeadDetails.jsx:371-373`](../../resources/js/pages/admin/LeadDetails.jsx#L371) renders `<CaseHealthBadge caseId={lead.id} />` **iff** `backendLead.is_immigration_case === true`, otherwise the engagement-flavoured `<LeadHealthBadge />`. Mutually exclusive. |

### 4a. What `LeadController::show` loads

Props passed to the page (from L633-L800+):

- `lead` (full Lead row, `backendLead`)
- `history` (last 80 `ActivityLog` rows for this subject)
- `notes` (`LeadNote`, pinned-first then newest)
- `tags` + `allTags`
- `tasks` (with eager-loaded `assignee`, `creator`, `attachments`)
- `stageTimeline`, `journey`, `checklist`, `documents`, `section_verifications`
- `statuses`, `staffOptions`, `currentUser`
- Plus a `CaseAuditView` write side-effect ([L645-L657](../../app/Http/Controllers/LeadController.php#L645)) for `is_immigration_case = true` leads when viewed by non-lead staff.

### 4b. There is no separate "case" controller method

There is no `casesShow`, `caseDetail`, or anything similar. The cases list ([`Portal\ImmigrationController::cases` L214-L303](../../app/Http/Controllers/Portal/ImmigrationController.php#L214)) renders `/portal/immigration/Cases`; each row links to `/portal/immigration/leads/{id}` — the same `LeadController::show` everywhere.

---

## Section 5 — The Lead-to-Case conversion flow

### 5a. The two conversion paths

| Origin | Endpoint | Controller method | Behaviour |
|---|---|---|---|
| Sales lead detail | `POST /admin/leads/{id}/convert-to-case` ([web.php convert section](../../routes/web.php)) | [`LeadController::convertToCase($id)` L1685-L1700](../../app/Http/Controllers/LeadController.php#L1685) | **Minimal flip.** |
| Immigration Assessments queue | `POST /portal/immigration/assessments/{id}/convert-to-case` ([web.php:712](../../routes/web.php#L712)) | [`Portal\ImmigrationController::convertAssessmentToCase($id)` L417-L516](../../app/Http/Controllers/Portal/ImmigrationController.php#L417) | **Full snapshot + match-by-email.** |

### 5b. `LeadController::convertToCase` — what it does

```php
$lead = Lead::findOrFail($id);
if ($lead->is_immigration_case) return back()->with('error', 'Already an immigration case.');
$lead->fill([
    'is_immigration_case'      => true,
    'immigration_converted_at' => now(),
    'immigration_converted_by' => auth()->id(),
])->save();
$this->notifyDepartmentOfConversion($lead, ['immigration', 'immigration_manager', 'immigration_adviser'], 'Immigration');
```

- **3 columns flipped** on the lead row. Nothing else touched.
- **No intake row created.** No `Assessment` created.
- Documents / notes / tasks / history rows: **untouched**.
- **Departmental notification fired** via `notifyDepartmentOfConversion` ([L1324](../../app/Http/Controllers/LeadController.php#L1324)) to all users with role in `['immigration', 'immigration_manager', 'immigration_adviser']`.
- Idempotent: re-running returns `Already an immigration case.` flash error.
- **No URL change** — the user stays on `/admin/leads/{id}` (or wherever they were); `back()` redirect. The lead's `lead_id` (`LP-...` etc.) is unchanged.
- **Reverse path exists:** `POST /admin/leads/{id}/revert-case` → [`LeadController::revertCase` L1703-L1712](../../app/Http/Controllers/LeadController.php#L1703) — flips the three columns back. No revert notification.

### 5c. `Portal\ImmigrationController::convertAssessmentToCase` — what it does

[L417-L516](../../app/Http/Controllers/Portal/ImmigrationController.php#L417) — much richer:

1. Resolves the `Assessment` row (or falls back to a `ResidentIntake` id for pre-Phase-B backward compat → resolves its paired Assessment OR calls the legacy `convertResidentIntakeWithoutAssessment` path [L523-L553](../../app/Http/Controllers/Portal/ImmigrationController.php#L523)).
2. Pulls the polymorphic `intake = $assessment->intakeable`.
3. Inside a DB transaction:
   - **Find-or-create Lead by email** ([L466-L483](../../app/Http/Controllers/Portal/ImmigrationController.php#L466)). New leads get `lead_id = 'LP-' . str_pad(max+1000, 5)`, `status = 'New Leads'`, `source = 'resident-intake' | 'work-intake' | 'student-intake' | 'visitor-intake'`. **Snapshot fields copied from the intake**: `first_name`, `last_name`/`family_name`, `email`, `phone`, `dob`, `citizenship` (← `country_of_citizenship`/`nationality`), `country_of_birth`, `place_of_birth`, `passport_number`, `passport_expiry`.
   - **Idempotent flip**: if `is_immigration_case === false`, set `is_immigration_case = true`, `immigration_converted_at = now()`, `immigration_converted_by = auth()->id()`, `stage_updated_at = now()`, `stage_updated_by = auth()->id()`. Always set `inz_visa_type = $visaType->name` (or `IntakeVisaTypeMap::label($intake::class)`). Re-converting preserves the original timestamp.
   - **Intake `status = 'Engaged'`** ([L503](../../app/Http/Controllers/Portal/ImmigrationController.php#L503)) — drops it out of the triage queue.
   - **Assessment `status = 'completed'`** ([L504](../../app/Http/Controllers/Portal/ImmigrationController.php#L504)).
4. **Redirects** to `/portal/immigration/leads/{lead->id}?tab=documents` with a success flash.

🔓 **No `notifyDepartmentOfConversion`** call on this path — the assessment-converted case **does not fire the same department notification** that the sales-converted case does. This is an inconsistency between the two flows.

### 5d. Audit log

The `LogsActivity` trait on `Lead` records the column changes for both conversion paths (via the normal `$model->save()`). Visible on the History tab of `LeadDetails`.

The `case_audit_views` table ([`CaseAuditView`](../../app/Models/CaseAuditView.php), migration [2026_05_21_130200_create_case_audit_views_table.php](../../database/migrations/2026_05_21_130200_create_case_audit_views_table.php)) records **views**, not conversions. Privacy Act 2020 read trail.

---

## Section 6 — Two origin paths: side-by-side

| Aspect | **Lead → Case** (sales path) | **Assessment → Case** (intake path) |
|---|---|---|
| Entry point | Sales staff or admin on `/admin/leads/{id}` clicks "Move to → Case" in the convert menu | Immigration staff clicks "Convert" on a row in `/portal/immigration/assessments` |
| HTTP endpoint | `POST /admin/leads/{id}/convert-to-case` | `POST /portal/immigration/assessments/{id}/convert-to-case` |
| Controller | `LeadController::convertToCase` | `Portal\ImmigrationController::convertAssessmentToCase` |
| Initial record(s) created | **None** — operates on the existing lead row | **`Lead` (if no email match)** with snapshot of ~10 intake fields. Existing matched Lead is updated, not duplicated. |
| `is_immigration_case` after run | `true` | `true` |
| `immigration_converted_at` / `immigration_converted_by` | Stamped (always) | Stamped only if newly converted (idempotent) |
| `stage_updated_at` / `stage_updated_by` | ❌ NOT stamped | ✅ Stamped on first conversion |
| `inz_visa_type` | ❌ Untouched (typically null) | ✅ Set to the linked `VisaType::name` (or `IntakeVisaTypeMap::label`) |
| Intake row created? | ❌ No | ❌ No (intake row already exists; pre-existed from the public form submit) |
| Assessment row created? | ❌ No | ❌ No (assessment row already exists from the form submit). On conversion, `assessment.status` is flipped to `'completed'`. |
| Intake status after run | (no intake) | `'Engaged'` — drops out of `/portal/immigration/assessments` queue |
| Where the consultant first sees them | The lead stays on `/admin/leads/{id}` (`back()` redirect). They then have to navigate to `/portal/immigration/leads/{id}` or `/portal/immigration/cases` to see it under immigration. | **Auto-redirected to `/portal/immigration/leads/{lead->id}?tab=documents`** with success flash. |
| Department notification | ✅ `notifyDepartmentOfConversion` fires (immigration, immigration_manager, immigration_adviser) | ❌ Does not fire |
| AI analysis available | Only if the lead was created via Free Assessment (then `ai_analysis` JSON exists). A sales-pipeline lead has no AI analysis. | Same — the intake doesn't trigger Cerebras either; the AI badge will be empty unless the lead also happened to submit a Free Assessment earlier. |
| Intake questionnaire data on the case | ❌ Not present (no intake link, no JSON `*_info` columns from a free assessment unless they happened to submit one) | ✅ Reachable via `Lead.email → Assessment → Assessment.intakeable` — but **the Case Detail page (`LeadDetails.jsx`) does not currently surface any of it**. The intake fields are only visible by navigating to the per-intake detail page. |
| What's missing at the start | Visa type, passport info, intake form answers, documents from the intake | Stage hand-off context, sales notes/tags, past activity that predated the immigration submit |

**The single biggest gap:** an assessment-converted case has a deep questionnaire sitting one polymorphic-morph away from the Lead row, but `LeadController::show` never loads it and `LeadDetails.jsx` never renders it. Today the consultant has to bounce between `/portal/immigration/leads/{id}` and `/portal/immigration/intakes/{type}/{intake_id}` (or the Resident URL) to see both halves.

---

## Section 7 — Existing Visa Assessment profile page (what it shows today)

Two surfaces here: (a) the **Assessments queue** at `/portal/immigration/assessments` (the "list" page), and (b) the **per-intake detail page** (the actual profile).

### 7a. `/portal/immigration/assessments` — the list page

Component: [`portal/immigration/Assessments.jsx`](../../resources/js/pages/portal/immigration/Assessments.jsx). Layout: `ImmigrationLayout`.

Sections / cards / panels:

| Panel | Component | What it shows | Read / write |
|---|---|---|---|
| Header (eyebrow "Work", title "Visa Assessment", description) | `PortalPageHeader` ([Assessments.jsx:115-119](../../resources/js/pages/portal/immigration/Assessments.jsx#L115)) | Page chrome | Read |
| Visa-type tab strip | `VisaTabButton` map ([Assessments.jsx:122+](../../resources/js/pages/portal/immigration/Assessments.jsx#L122)) | `All Talents` · `Resident` · `Work` · `Student` · `Visitor` with counts | Filter (client-side) |
| Status pills | `StatusPill` ([L242+](../../resources/js/pages/portal/immigration/Assessments.jsx#L242)) | `All` · `Submitted` · `Draft` · `Completed` with counts | Filter (client-side) |
| Search input | inline | Filters by name / email / phone / intake_id | Filter (client-side) |
| Intake table | `IntakeRow` ([L269+](../../resources/js/pages/portal/immigration/Assessments.jsx#L269)) | Per row: avatar (visa-type colour), name + intake_id, visa label + `i.extra`, email + phone, **3-stage progress bar** (Draft/Submitted/Completed), submitted date, action column with `Convert` + `Open` buttons | Read + 2 row actions |
| Expanded row | `JourneyRow` ([L400+](../../resources/js/pages/portal/immigration/Assessments.jsx#L400)) | 3-step journey (`Submitted` → `Triaged` → `Converted to Case`) with timestamps. Pay / Book steps deliberately omitted (payment intake dormant). | Read |

Actions available:
- **Convert** — POSTs to `/portal/immigration/assessments/{id}/convert-to-case` (Section 5). Gated on `i.can_convert` (intake has paired Assessment AND status not Engaged AND no matching converted lead).
- **Open** — navigates to `i.detail_url` (`/admin/immigration/resident-intakes/{id}` for Resident, `/portal/immigration/intakes/{type}/{id}` for Work/Student/Visitor).

No comments, no document requests, no notes, no AI panel on this list page.

### 7b. Per-intake detail page — the actual profile

Component: [`portal/immigration/IntakeDetails.jsx`](../../resources/js/pages/portal/immigration/IntakeDetails.jsx). Same component renders all 4 visa types; per-type field schema in `SCHEMA` constant ([L98-L254](../../resources/js/pages/portal/immigration/IntakeDetails.jsx#L98)).

Visual layout: **single-column, vertical scroll**, with a gradient hero, snapshot chips, and a 2-column body (main + sticky right rail).

| Block | What it shows | Read / write |
|---|---|---|
| Back link | "Back to assessments" | Read |
| Print + Download buttons | Print the page or download intake row as JSON | Action |
| **HERO** | Gradient banner + 96×96 avatar + name + visa-type label + intake_id + status pill ([IntakeDetails.jsx:405-444](../../resources/js/pages/portal/immigration/IntakeDetails.jsx#L405)) | Read |
| Snapshot chips | Up to 6 chips: citizenship / age / gender / partnership / current country / NZ-arrival date ([L429-L442](../../resources/js/pages/portal/immigration/IntakeDetails.jsx#L429)) | Read |
| Sidebar — Contact | Email / Phone / Address / Region — auto-`tel:`/`mailto:` links | Read |
| Sidebar — Submission | Status / Submitted / Last updated + Pay & Book sub-panel (Assessment status, Paid, Booking) | Read |
| Sidebar — Documents card (Resident only) | Document checklist with View / Download links per uploaded PDF | Read + download |
| Sidebar — Linked-case shortcut | Card linking to `/portal/immigration/leads/{id}` if email matches an `is_immigration_case` Lead | Navigate |
| Main — Featured headline section | Per visa type: Resident `Passport & visa`, Work `Job offer`, Student `Study plan`, Visitor `Visit details` | Read |
| Main — Property sections (schema-driven, auto-hide when empty) | Personal details · Identity · Contact (+address for Visitor) · NZ history · Current employment · Finance (Student/Visitor) · Qualifications/Education · Character · Health · Family · NZ contacts · Military service · Travel history · Declaration | Read |
| Convert button | ❌ **NOT here** — the convert button only lives on the Assessments queue row, not on the detail page. |

**Read-only** throughout. Staff cannot edit, comment, request additional docs, change status, mark triaged, etc. from this page. The only writes available are Print + Download JSON.

**What this page does NOT include:**
- ❌ No notes / comments
- ❌ No tasks
- ❌ No tags
- ❌ No tracking-code link
- ❌ No AI panel
- ❌ No activity feed
- ❌ No status-change controls
- ❌ No document upload (Resident has read-only download only)
- ❌ No "Convert" / "Engage" / "Reject" buttons

---

## Section 8 — Gaps between Visa Assessment profile (IntakeDetails) and Case Detail (LeadDetails)

### 8a. Present on the **IntakeDetails** profile but NOT on `LeadDetails.jsx`

| Feature | Where it surfaces on IntakeDetails | Why it's missing on LeadDetails |
|---|---|---|
| Deep questionnaire data (~70 columns per intake type, sectioned A–L/A–M) | `RenderSection` per `SCHEMA[type]` ([IntakeDetails.jsx:98-254](../../resources/js/pages/portal/immigration/IntakeDetails.jsx#L98)) | `LeadController::show` never loads the linked intake. `LeadDetails` renders only the `leads` table row + its standard relations. |
| Pay & Book sidebar (assessment status, paid_at, booking date/time) | Sidebar Submission card | No equivalent — leads don't have an assessment-funnel context unless explicitly linked. |
| Intake-specific JSON arrays (previous_roles, family_members, qualifications, available_funds, travel_trips) | Rendered as multi-line `<pre>` blocks in the matching section | The lead row doesn't carry these arrays for assessment-converted cases. |
| Document checklist with per-file View/Download links (Resident) | Sidebar `DocumentsCard` | LeadDetails has the `LeadDocument`-based checklist but **not** the Resident intake's `documents` JSON + `document_files` JSON. Same applicant could have two disjoint document buckets. |
| "Converted to case" sidebar shortcut | Sidebar `linkedLead` card | N/A — when you're already on the case, you don't need a shortcut to it. |
| Print + Download JSON | Header toolbar | Not implemented on `LeadDetails`. |

### 8b. Present on **LeadDetails** but NOT on IntakeDetails

| Feature | Where it surfaces on LeadDetails | Why it's missing on IntakeDetails |
|---|---|---|
| AI badges (`CaseHealthBadge` for immigration cases, `LeadHealthBadge` otherwise) | [LeadDetails.jsx:371-373](../../resources/js/pages/admin/LeadDetails.jsx#L371) | Intakes have no Cerebras dispatch on submit. |
| Tasks panel + multi-assignee picker + attachments | `TasksPanel` | Tasks are bound to `lead_id`. |
| Notes (`LeadNote`) — pinned/general/pre-screen/goal-setting | `NotesPanel` | Same — notes are scoped to `lead_id`. |
| Tags (`LeadTag` many-to-many) with autocomplete | `TagsPanel` | Same. |
| Activity / History feed (`ActivityLog` filtered by subject) | `ActivityPanel` | Intakes don't get `LogsActivity` events; the IntakeDetails has no history. |
| Stage timeline + Journey panel (`stageTimeline`, `journey` props) | `StageTimeline`, `JourneyPanel` | Intake has only a flat 3-step (Submitted → Triaged → Converted) journey on the list-row expansion. |
| Stage picker + status changes + `inz_status` tracking | `Move-to` dropdown + stage chip + inz controls | Intake page is read-only. |
| Lead-portal invitation controls | `PortalInvitationPanel` | Intakes have no portal-user link. |
| Lead documents (`LeadDocument` + checklist + section verifications + staff-share) | `DocumentsPanel` | Separate doc system from the intake's `document_files` JSON. |
| Tracking code (`/track/{code}`) + "Copy tracking link" | Lead toolbar | Intakes don't get a tracking code. |
| Department-conversion convert menu (`Move to → Student / Case / English / Housing`) + revert | `ConvertMenu` | N/A — the intake has its own one-shot Convert button on the queue. |
| Section-verification flow on checklist documents | Documents panel | Not surfaced here. |
| Communications surface (Build 9 / 10 inferred from CLAUDE.md, not directly read) | (whatever LeadDetails wires for comms) | N/A on intake page. |

### 8c. The unification implication

A unified "Case Profile" page needs at minimum:
1. The full `LeadDetails` rendering it has today (AI badge, tasks, notes, tags, activity, stage timeline, lead docs, communications, convert menu).
2. Plus an **"Intake submission"** section that surfaces:
   - The matched `Assessment` row + paired `intakeable` (the right `*_intakes` row) when present.
   - The full `SCHEMA`-driven sectional rendering currently in `IntakeDetails`.
   - The intake's documents (Resident's `document_files`) with the existing view/download URLs.
   - The Pay & Book / Submission sidebar block.
3. Plus a graceful **empty state** for cases that have no intake — Sales-converted cases will be in this bucket and shouldn't see a broken or empty intake panel.
4. Plus a **Free-Assessment data** surface when `leads.ai_analysis` is populated — currently never displayed inside `LeadDetails`'s body in a structured way (only the score badge).

---

## Section 9 — Routing decision logic

### 9a. Where each entry point lands today

| From | URL clicked | Lands on | Component |
|---|---|---|---|
| `/portal/immigration/cases` row → "Open" | `/portal/immigration/leads/{id}` | `LeadController::show` ([web.php:697](../../routes/web.php#L697)) | `portal/immigration/LeadDetails` → re-export of `admin/LeadDetails` |
| `/portal/immigration/leads` row → "View" | `/portal/immigration/leads/{id}` | same | same |
| `/admin/leads/{id}` | `/admin/leads/{id}` | `LeadController::show` ([admin route group](../../routes/web.php)) | `admin/LeadDetails` |
| `/portal/sales/leads/{id}` | `/portal/sales/leads/{id}` | same controller, different URL prefix | `portal/sales/LeadDetails` → re-export of `admin/LeadDetails`, wrapped in `SalesLayout` |
| `/portal/immigration/assessments` row → "Open" (Resident) | `/admin/immigration/resident-intakes/{id}` | `ResidentIntakeController::adminShow` ([web.php:534](../../routes/web.php#L534)) | `admin/immigration/ResidentIntakeDetails` (re-export of `portal/immigration/IntakeDetails`) wrapped in `AdminLayout` |
| `/portal/immigration/assessments` row → "Open" (Work / Student / Visitor) | `/portal/immigration/intakes/{type}/{id}` | `Portal\ImmigrationController::showIntake` ([web.php:704](../../routes/web.php#L704)) | `portal/immigration/IntakeDetails` wrapped in `ImmigrationLayout` |
| `/portal/immigration/assessments` row → "Convert" | POST `/portal/immigration/assessments/{id}/convert-to-case` → server redirects to → | `/portal/immigration/leads/{lead->id}?tab=documents` | `portal/immigration/LeadDetails` |
| Sidebar landing (immigration role default) | `/portal/immigration/dashboard` | `Portal\ImmigrationController::dashboard` | `portal/immigration/Dashboard` |

### 9b. The page-name rewrite trick

[`LeadController::show` L686-L690](../../app/Http/Controllers/LeadController.php#L686):

```php
$path = request()->path(); // e.g. "portal/sales/leads/23"
$page = 'admin/LeadDetails';
foreach (['sales', 'education', 'english', 'immigration', 'accommodation'] as $role) {
    str_starts_with($path, "portal/{$role}/") ? $page = "portal/{$role}/LeadDetails" : null;
}
```

This is how the same controller method renders the same component under five different layouts. Each `portal/{role}/LeadDetails.jsx` is a one-line re-export of `admin/LeadDetails.jsx`; the layout auto-wrap reads the page-name prefix.

🔓 **Implication for unification:** any unified "Case Profile" page can follow the exact same pattern — render the same component under different layouts — without doubling the actual rendering logic.

### 9c. Deep-link preservation requirements

| Source | Deep link | Needs to keep working |
|---|---|---|
| Convert-to-case redirect | `/portal/immigration/leads/{id}?tab=documents` (the `tab` query param) | ✅ Unified page must accept `?tab=` to deep-link to the Documents tab. |
| Resident intake admin URL | `/admin/immigration/resident-intakes/{id}` | ✅ Used in `i.detail_url` for resident rows on the Assessments queue; also reachable from the legacy `ResidentIntakes.jsx` admin index. Edit-link generation also references this id. |
| Resident document download URL | `/admin/immigration/resident-intakes/{id}/documents/{key}/{index?}` | ✅ Hardcoded in `IntakeDetails` `DocumentsCard` ([IntakeDetails.jsx](../../resources/js/pages/portal/immigration/IntakeDetails.jsx)) — must keep this URL pattern. |
| `AnalyzeLeadAssessment` job / `CaseHealthBadge` | API endpoints under `routes/web.php:262-263` (`/cases/{case}/analysis`, `/cases/{case}/analysis/refresh`) | ✅ Routes use `{case}` route-param-name but the underlying model is `Lead`. Component fetches by `lead.id`. |
| Lead tracking code public URL | `/track/{code}` (referenced in `LeadDetails` toolbar — Section 9b is at the tracking-route file) | ✅ Tracking page reads from `leads.tracking_code`; not affected by unification. |
| Assessment Pay/Book tokens | `/assessment/{token}/pay`, `/book`, `/booked` | Currently dormant ([AssessmentController::simulatePay](../../app/Http/Controllers/AssessmentController.php)) — keep the token addressable so when Stripe goes live the existing route works. |

Notifications / emails: I did not find an email or notification template that deep-links directly into the IntakeDetails URL. The `notifyDepartmentOfConversion` ([LeadController L1324](../../app/Http/Controllers/LeadController.php#L1324)) likely points at the lead detail; I did not read that method body to confirm.

---

## Section 10 — Existing tests touching this area

| Test file | Tests (count) | Covers |
|---|---|---|
| [`tests/Feature/Immigration/AssessmentPipelineTest.php`](../../tests/Feature/Immigration/AssessmentPipelineTest.php) | 22 | **The full intake→assessment→case pipeline.** Every public visa-interest submit creates a paired Assessment (tests 01-04), correct `visa_type_id` per intake class (05), identity snapshot (06), initial status (07), thank-you flash (08), graceful no-visa-type behaviour (09), convert-to-case for all four types (10-13), email-matching of existing leads (14), idempotency + timestamps (15, 17, 18), `Engaged` status flip (16), legacy ResidentIntake-id convert URL (19), backfill command for historical intakes (20-22). **Critical to keep passing through unification.** |
| [`tests/Feature/Immigration/IntakeMassAssignmentTest.php`](../../tests/Feature/Immigration/IntakeMassAssignmentTest.php) | 4 | Mass-assignment coverage on `WorkIntake`, `StudentIntake`, `VisitorIntake`, plus `Booking.lead_id`. |
| [`tests/Feature/Immigration/VisaChecklistSeederTest.php`](../../tests/Feature/Immigration/VisaChecklistSeederTest.php) | (not read) | Visa-type checklist seeder. |
| [`tests/Feature/Immigration/VisaTypesPageTest.php`](../../tests/Feature/Immigration/VisaTypesPageTest.php) | (not read) | Visa types admin page. |
| [`tests/Feature/Leads/ConvertedLeadsHiddenTest.php`](../../tests/Feature/Leads/ConvertedLeadsHiddenTest.php) | 3 | After conversion, the lead drops out of the sales/education/admin lists. Tests: `test_education_leads_list_excludes_converted_students`, `test_immigration_leads_list_excludes_converted_cases`, `test_admin_and_sales_lists_already_exclude_converted`. **Affects the "where does a converted lead show up" question.** |
| [`tests/Feature/Lead/PersonalProfileTest.php`](../../tests/Feature/Lead/PersonalProfileTest.php) | 25 | Heavy coverage of the new lead-personal-profile sections: column existence, validation (passport, health, character, employment, family), encryption-at-rest for passport_number (test 05), conditional `required_if` rules, partial section saves, computed accessors, audit-log writes on save, the assessment-pipeline models still composing (test 19), tracking-page rendering with the wide profile (test 20), round-tripping (test 22), and the late `add_*_to_leads` migrations (tests 23-25). **Establishes the lead row as the authoritative profile store.** |
| [`tests/Feature/Ai/CaseAnalysisTest.php`](../../tests/Feature/Ai/CaseAnalysisTest.php) | 12 | Build 10's case-health analyser. Tests: consultant can analyse (01), immigration_manager + adviser can analyse (02), sales/education/english staff cannot (03-05), admin can (06), 24h cache (07), force refresh (08), critical-health notification (09-10), disabled-AI payload (11), and **case analysis does not collide with lead analysis** (12). |
| [`tests/Feature/FreeAssessmentTest.php`](../../tests/Feature/FreeAssessmentTest.php) | ~12 | Free Assessment funnel: page load, full submission, study plans saved as related record, education entries, education_notes high-school+gap, work_experience JSON, validation requires terms, partial submission rejected, passport PDF upload, invalid email, FA- prefix. |
| [`tests/Feature/ResidentIntakeUploadTest.php`](../../tests/Feature/ResidentIntakeUploadTest.php) | 5 | Resident intake document storage: PDF stored + referenced, multiple PDFs per key + other bucket, edit-link token allows append, admin can generate edit link, submission without files. |

**What the unification work must not break:**
- All 22 `AssessmentPipelineTest` cases — the create + match-by-email + status-flip behaviour.
- All 3 `ConvertedLeadsHiddenTest` cases — the converted-lead drop-out behaviour.
- All 12 `CaseAnalysisTest` cases — the AI badge wiring.
- The `IntakeMassAssignmentTest` mass-assignment guarantees on the intake models (any reshaping must keep `$fillable` honest).
- The `ResidentIntakeUploadTest` document round-trip.

---

## Section 11 — Confidence and gaps

### Verified with high confidence (read the code)

- **Routes** — exact URLs, controller methods, middleware chains, page names, route names. `php artisan route:list` output + `routes/web.php` lines confirmed.
- **`*_intakes` table schemas** — read the four create-table migrations end-to-end.
- **`assessments` table** — read the migration and the `Assessment` model including `createForIntake` (the helper that wires intake→assessment).
- **`Assessment::createForIntake` idempotency + applicant snapshot semantics** — verified in `app/Models/Assessment.php` L120-L159.
- **`Portal\ImmigrationController::convertAssessmentToCase` behaviour** — read L417-L516 end-to-end; tested by `AssessmentPipelineTest` 10-19.
- **`LeadController::convertToCase` minimal-flip semantics** — read L1685-L1700.
- **`LeadController::show` page-name rewrite + the per-prefix re-export pattern** — read L633-L690.
- **`LeadDetails.jsx` Case Health Badge gating** — read line 371-373.
- **`IntakeDetails.jsx` SCHEMA, hero, sidebar, sections** — read structure end-to-end.
- **`/portal/immigration/assessments` page filters, row actions, convert-button gating** — read L1-L400.
- **Resident intake `store` flow + tracking-Assessment creation** — read L137-L195.
- **Free-Assessment funnel store path + AI dispatch** — read L330-L600.
- **Lead model encrypted casts** (`passport_number`, `current_nz_visa_number`) — read L301-L302.
- **Test coverage** — read every test file's test-method names (read full bodies only for `AssessmentPipelineTest` 10-19).

### Inferred or low-confidence

- **`notifyDepartmentOfConversion`** — read the call sites but **not the method body** ([LeadController L1324](../../app/Http/Controllers/LeadController.php#L1324)). The method exists and runs for `convertToCase` (sales path) but not for `convertAssessmentToCase` (immigration path). What it sends, how it deep-links, and what channel — not verified.
- **`AnalyzeLeadAssessment` job + Cerebras prompting** — confirmed dispatched from `storeFreeAssessment` but did not open the job class. `CerebrasService` referenced in CLAUDE.md, not directly read.
- **`Portal\ImmigrationController::showIntake`** — confirmed by route definition and controller header, but the method body (rough lines 273-344 estimated) wasn't read line-by-line in this audit; the rendering output is inferred from the IntakeDetails component's prop expectations + the equivalent ResidentIntakeController::adminShow at L300-L340.
- **`<CaseHealthBadge />` internals** — confirmed it renders and is gated correctly, but did not open `resources/js/components/ai/CaseHealthBadge.jsx`.
- **`AiCaseAnalysisController`** — confirmed via routes ([web.php:262-263](../../routes/web.php#L262)) but did not open the controller file. Route param is `{case}` but underlying model is `Lead`.
- **`User::canAccessPortal` exact behaviour for `immigration_manager` / `immigration_adviser`** — inferred from CLAUDE.md + the constant `IMMIGRATION_ROLES`; should be re-verified before relying on access-control assumptions in any unification.
- **Communications surface on `LeadDetails`** — Build 9/10 mentioned in CLAUDE.md but I didn't directly read the Communications panel. The gap analysis (Section 8b) lists it under "what LeadDetails has that IntakeDetails doesn't" but the exact component name + capabilities are not verified.

### Couldn't investigate (time-box / out of scope)

- **PDF generation pipeline** — Resident edit-link + document download routes were confirmed but the `persistUploadedFiles` helper + the storage layout in detail were not opened.
- **The `case_audit_views` table** schema + every read site — confirmed write-side at LeadController L645; read side not surveyed.
- **`tests/Feature/Immigration/VisaChecklistSeederTest.php` + `VisaTypesPageTest.php`** — listed only.
- **Sales-converted case → does the convert menu work from `/portal/immigration/leads/{id}`?** — the convert menu lives on `LeadDetails` and is reachable from any URL prefix. I did not click-trace whether the menu's `convertToCase` button on a lead already viewed under the immigration prefix works the same as from the admin prefix.
- **What `notifyDepartmentOfConversion` sends to the immigration team** — not opened.
- **The `Lead` route param resolution** at `LeadController::show` accepts `id` OR `lead_id` — confirmed in code ([L633-L638](../../app/Http/Controllers/LeadController.php#L633)) but didn't test edge cases (collision between integer id and integer-only lead_id).

### Surprises (worth flagging)

1. **There is no `VisaAssessment` model.** "Visa assessment" is a UX label spanning 5 tables. The unification phrasing in the task brief implies a single source — it doesn't exist.
2. **Two separate "assessment" funnels with non-overlapping data shapes.** The Free Assessment (lead-row JSON) and the public visa-interest forms (intake tables) are entirely disjoint. A client could submit a Free Assessment and a Resident intake under the same email and the system would have two completely separate stores of the same person's data joined only by email. Neither funnel reads from the other.
3. **The Resident detail page sits under `/admin/...` while Work/Student/Visitor sit under `/portal/immigration/...`** — for purely historical reasons (Resident intake predates the unified IntakeDetails component). They render the same component but auto-wrap in different layouts (`AdminLayout` vs `ImmigrationLayout`) because the page-name prefix differs.
4. **`convertToCase` (sales) doesn't stamp `stage_updated_at` / `stage_updated_by`; `convertAssessmentToCase` (immigration) does.** This means the Cases list's "Updated [date] · Endorsed by [Name]" subtitle will show meaningful data for assessment-converted cases but blanks for sales-converted ones — a real UX inconsistency right now.
5. **`convertAssessmentToCase` skips `notifyDepartmentOfConversion`** while `convertToCase` calls it. Immigration is therefore notified about sales-converted cases but not about assessment-converted ones. The immigration team is presumably the one doing the assessment-conversion themselves so they already know — but if any audit / log / external-trigger downstream depends on the notification firing, there's an asymmetry.
6. **Passport number is encrypted only on the `leads` table, not on the `*_intakes` tables.** After `convertAssessmentToCase` copies the value into `leads.passport_number`, both stores hold it — the lead's encrypted, the intake's plaintext. Data minimisation would say the intake row's plaintext should be cleared post-conversion; that does not happen today.
7. **Intake views aren't audited.** `CaseAuditView` writes only on `LeadController::show` for `is_immigration_case = true` rows. A consultant viewing the intake detail page (which contains the same applicant's passport, dob, financials, etc.) leaves no audit trail.
8. **The Convert button lives only on the queue list, not on the IntakeDetails page.** A consultant who opens an intake from the queue, reads it, and decides "yes convert" has to navigate back to the queue. Could be inlined onto the detail page.
9. **`bookingsConfirmed` / `bookingsPending` on Super Dashboard query by `status = 'confirmed'` / `'pending'`** (lowercase) — observed in `SuperAdminDashboardController` reminder context; unrelated to this audit but flagged because the Booking model's status casing elsewhere uses `'Confirmed'` / `'Pending'`. Possible casing mismatch. Not in scope but worth a follow-up.

---

**End of audit.** Next step (per the task brief): a separate planning session designing the unified "Case Profile" page using these findings, then a build session to implement it.
