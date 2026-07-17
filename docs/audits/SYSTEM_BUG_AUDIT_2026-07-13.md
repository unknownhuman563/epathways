# System Bug Audit — Correctness Bugs

**Repository:** ePathways CRM (Laravel 12 + React 19 + Inertia)
**Branch:** `full_blown`
**Date:** 2026-07-13
**Method:** Six parallel read-only investigators (one per section), synthesized, with **every High finding cross-verified against actual code** before publishing. Findings flagged by more than one investigator are noted. Investigation only — no code changed, no commits, no other files touched.
**Lens:** Correctness only. Security (Sub-audits 1 & 2.5), code quality/dead-code/tests (Sub-audit 2), and routes (Sub-audit 2.5) are out of scope here and cited-not-re-derived where they overlap.

> **Configured application timezone: `UTC`** (`config/app.php:68`). Business operates in NZ (Pacific/Auckland). Only `SlotGenerator` re-anchors to Auckland; everything else compares against UTC `now()`. This underlies several timing findings.

---

## Executive Summary

- **Total findings: 33** — **Critical: 0 · High: 5 · Medium: 12 · Low: 16**
- **Overall correctness assessment: Concerning (localized).** The codebase is, on the whole, defensively written — error handling logs with context and returns honest errors, external HTTP callers check `->successful()`, both React kanban boards do optimistic-update-with-rollback correctly, and money is stored/sent to Stripe correctly (decimal dollars in DB, integer cents to Stripe). The correctness debt is **concentrated in three hotspots**: (1) **human-reference (`lead_id`) generation** — five mutually-incompatible, non-atomic schemes writing to a `unique` column; (2) the **AI-assessment data path** — wrong dashboard key, fake-`completed` drafts, and a frontend spinner that never self-resolves on top of a job that can hang; (3) **bulk email/SMS dispatch** — a queue-timeout misconfiguration that duplicates mass sends. Fix those three clusters and the correctness posture jumps to Good.

### Top 5 bugs by impact (severity × likelihood of triggering)

| # | Finding | Why it ranks | §
|---|---------|--------------|---|
| 1 | **`rand()` `lead_id` collision → silent lead loss** | Common path (every public capture), probability grows with table size (~22% collision at 20k leads), invisible when it drops a lead | §3-H1 |
| 2 | **`max('id')+offset` lead_id: race + cross-scheme collisions** | Immigration case conversions fail intermittently (guaranteed right after any `+1001`-path lead); concurrent creates race | §3-H2 |
| 3 | **Bulk campaign/event jobs double-send** (`timeout` 600/300s > `retry_after` 90s) | Fires on any blast that takes >90s to fan out (routine for large lists); duplicate SMS = direct Twilio cost | §6-H |
| 4 | **SuperAdmin AI-eligibility chart always wrong** (reads non-existent `eligibility_score`/`score` vs stored `overall_score`) | Every dashboard load, unconditionally; misleads the person most likely to act. Read-only (no corruption) | §2-H |
| 5 | **Assessment "processing" dead-end** (job can hang on `\Error`/worker-kill + frontend never auto-polls) | Public lead-gen funnel; common (analysis is async, spinner shows at redirect); looks hung. **Flagged by §1 + §5 + §2** | §1/§5 |

Closely behind: **§4-H portal-login email drift** (severe — clients locked out, support hands out non-working credentials — but rarer precondition).

---

## Section 1: Silent Failures and Error Handling

Error handling is unusually disciplined (see Verified-OK). The gaps are three narrow *masking* cases, all Medium (each needs an infrastructure failure to trigger).

### [Medium] Failed email delivery leaves MessageLog stuck on `queued` forever; bulk campaigns count it as "sent"
**Location:** `app/Mail/TemplatedMessage.php:31` (no `failed()`), `app/Listeners/MarkMessageLogSent.php:29-31`, `app/Services/CommunicationService.php:133-137,261-280`
**Description:** `sendEmail()` writes a `MessageLog` as `queued` then `Mail::queue(...)`. The log is flipped to `sent` only by the `MessageSent` success listener. `TemplatedMessage` is `ShouldQueue` but has **no `failed()` method**, so when the worker's send throws (SMTP down/auth/bounce-on-send) the job lands in `failed_jobs` and the log stays `queued` permanently. `bulkSendTemplated()` treats any non-`FAILED` log as sent (`$failed = $log && $log->status === STATUS_FAILED`), so a campaign that silently failed at SMTP reports "sent" per lead. **(Flagged by §6 too — see §6 `sent_count` finding.)**
**Reproduction:** 1. As sales/admin with SMTP unreachable at worker time. 2. Send a templated email or run a bulk campaign. 3. Toast says "queued"; the `MessageLog` stays `queued` forever; the bulk summary counts it sent. 4. Staff believe the client was emailed; nothing arrived, no `failed` ever surfaces.
**Impact:** Staff cannot distinguish "in flight" from "permanently failed" in the comms log. Frequency: occasional (only on mail-transport failure).
**Recommendation:** Add `failed(\Throwable $e)` to `TemplatedMessage` flipping the carried `logId` to `STATUS_FAILED`; add a stale-`queued` sweep as backstop.
**Effort:** Small

### [Medium] Visa-type price change commits, but user sees a 500 when the notification can't send
**Location:** `app/Http/Controllers/VisaTypeController.php:213-228`, `app/Notifications/VisaTypePriceChanged.php:28-38`
**Description:** After the `DB::transaction` commits the new price + history, the method calls `Notification::send($recipients, new VisaTypePriceChanged(...))` at `:225` with **no try/catch**. `VisaTypePriceChanged` uses `Queueable` but does **not** implement `ShouldQueue`, and `via()` adds `'mail'` for admin/immigration-manager recipients, so mail sends synchronously. If SMTP is down, `Notification::send` throws *after* the price is already committed → 500/Inertia error, success flash never shows.
**Reproduction:** 1. As admin/immigration manager with SMTP unreachable. 2. Edit a visa type's `consultation_price_nzd`, save. 3. Error page, no success toast — but the price **did** change. A retry shows "success" but sends no notification (price now unchanged), leaving staff unsure it applied.
**Impact:** False failure masking a real success on an admin-config path; risk of double-editing. Frequency: rare (SMTP failure).
**Recommendation:** Make `VisaTypePriceChanged implements ShouldQueue`, or wrap the send in try/catch that logs and still returns success (matching `LeadController:1991`, `EventController:673`, `TaskController:272`).
**Effort:** Small

### [Medium] `AnalyzeLeadAssessment` can strand a lead on `ai_analysis_status = processing` forever
**Location:** `app/Jobs/AnalyzeLeadAssessment.php:25-54`
**Description:** Sets `processing` at `:27`, then `try {...} catch (\Exception $e)` marking `failed` only when `attempts() >= tries`. Two gaps: (1) the catch is `\Exception`, so a `\Error`/`\TypeError` (thrown deep in `CerebrasService` parsing or the `update()`) bypasses it; (2) **no `failed()` method**, so a worker kill (OOM/`queue:restart`/timeout) or non-`\Exception` throwable never moves the lead off `processing`. **This compounds with §5 (the frontend spinner never auto-polls) and §2 (draft path writes fake `completed`) — together a public-funnel dead-end.**
**Reproduction:** 1. Public user submits Free Assessment. 2. The job dies via `\Error` or the worker is restarted mid-run. 3. Applicant sees an infinite "Analyzing Your Profile" spinner; the friendly `failed` "we'll review manually" copy never appears; the lead sits in `processing` with no signal for manual follow-up.
**Impact:** Applicant-facing dead-end on the primary lead-gen funnel. Frequency: rare (needs a fatal `\Error`/worker death; ordinary Cerebras HTTP/JSON errors are `\Exception` and are handled).
**Recommendation:** Catch `\Throwable`; add `public function failed(\Throwable $e)` setting `ai_analysis_status = 'failed'`.
**Effort:** Small

### [Low] `ChatController` Gemini call has no HTTP timeout
`app/Http/Controllers/ChatController.php:66-78` — no `->timeout()`. It checks `->failed()` and catches exceptions (not a silent failure), but a hung Gemini connection can block a PHP-FPM worker indefinitely (unlike `CerebrasService`/`AIService`/`BrevoSmsProvider`, which set timeouts). Add `->timeout(30)`. **Effort:** Small

### [Low] `SendScheduledEventEmail` has no `$tries`/`failed()` and marks queued-but-undelivered mail as SENT
`app/Jobs/SendScheduledEventEmail.php:20-66` — no `$tries` (1 attempt), no `failed()`; status decided by `EventEmailSender`'s tally which counts `queued` logs as sent (same root cause as the first finding). A blast that fails at SMTP records `STATUS_SENT`; a throw between claim and final update strands the row on `sending`. **Effort:** Small

---

## Section 2: Null / Type / Coercion Bugs

Backend is well-guarded for null relation chains (every `assignee`/`author` serialize is ternary-guarded), `json_decode`/`->json()` are consistently null-checked, and PHP uses strict `===` throughout (no loose `==` in `app/`). Two real defects, both in the AI-analysis path.

### [High] SuperAdmin AI-eligibility chart reads a non-existent score key — every completed lead buckets to "<30"  ✅ *code-verified*
**Location:** `app/Http/Controllers/Admin/SuperAdminDashboardController.php:78`
**Description:** The dashboard buckets each completed lead by `(int) ($data['eligibility_score'] ?? $data['score'] ?? 0)`. But `CerebrasService::analyze()` stores the score under **`overall_score`** (verified: `CerebrasService.php:349` validates `overall_score`+`categories`; `:458` example; the correct reader `BuildsLeadRow.php:75` uses `$ai['overall_score']`). Neither `eligibility_score` nor `score` is ever written (grep across `app/` confirms). So the `??` chain always falls to `0` and every completed lead lands in `<30`.
**Reproduction:** 1. Analyze several leads so `ai_analysis.overall_score` is e.g. 85. 2. Log in as super-admin, open the dashboard. 3. The "AI eligibility" distribution shows `<30 = N`, all other tiers `0`, regardless of real scores.
**Impact:** Eligibility chart unconditionally wrong on every dashboard load, hiding the real quality mix from the person most likely to act. Read/reporting bug (no corruption). Frequency: **common (every load).**
**Recommendation:** Read `$data['overall_score'] ?? 0`. Consider a shared accessor so dashboard and `BuildsLeadRow` can't drift again.
**Effort:** Small

### [Medium] `saveAssessmentDraft` marks leads AI-`completed` with raw form data instead of an analysis
**Location:** `app/Http/Controllers/LeadController.php:318-319` (method `saveAssessmentDraft`, 268-341)
**Description:** The draft/autosave endpoint writes `'ai_analysis' => $request->except(['_token'])` and `'ai_analysis_status' => 'completed'`. The stored blob is the raw form payload — no `overall_score`/`categories`. Only a genuine final submit re-runs `AnalyzeLeadAssessment` (`:750`); a draft never submitted stays permanently fake-`completed`. This is also the one place request data is persisted essentially unvalidated (only name/email/phone validated at 279-288; the rest of `$request->except(['_token'])` dumped into the JSON column).
**Reproduction:** 1. On `/free-assessment`, enter name+email, trigger autosave/"Save draft", close the tab. 2. As staff, open the Assessments queue: the row shows `analysis_done = true` but `ai_score = null` (key absent). 3. The Sales `ai_done` KPI (`SalesController.php:63-64`) increments for a never-analyzed draft. 4. Opening its public result page feeds `AssessmentResult` raw form fields where it expects `overall_score`/`categories` → broken sections.
**Impact:** Abandoned drafts (common for a long multi-step form) misreport as "AI complete," inflating done-counts and showing staff a scoreless "completed" analysis.
**Recommendation:** Don't touch `ai_analysis`/`ai_analysis_status` in the draft path (leave `pending`/null, stash partial data in a dedicated column); whitelist fields instead of dumping `$request->except`.
**Effort:** Small

### [Low] `show()` id-vs-code lookup relies on MySQL string→int coercion
`app/Http/Controllers/LeadController.php:1130-1133` — `Lead::where('id',$id)->orWhere('lead_id',$id)`. `lead_id` values are always letter-prefixed (`FA-`/`EE-`/`LP-`), so no code coerces to a colliding integer *today*; latent risk is `/admin/leads/5abc` coercing `'5abc'`→`5` on the `id` comparison. Branch on `ctype_digit($id)`. **Effort:** Small

---

## Section 3: State Machine and Business Logic Bugs

The well-guarded machines (agreements, invitations, EOI onboarding, convert-to-X double-convert, payment idempotency) are in Verified-OK. The damage is concentrated in **`lead_id` generation**: five incompatible schemes on a `unique` column, none atomic.

### [High] Primary lead-intake generates `lead_id` with `rand()` against a UNIQUE column — silent lead loss as volume grows  ✅ *code-verified*
**Location:** `app/Services/LeadIntakeService.php:102`; same pattern `app/Http/Controllers/LeadController.php:184`
**Description:** `createNew()` — the shared entry point for **every** public capture (QuickLead hero/exit/footer, booking, event registration) — sets `'lead_id' => $payload['lead_id'] ?? 'LP-'.rand(10000, 99999)`. `leads.lead_id` is `->unique()` (`2026_03_24_081240_create_leads_table.php:13`). Only 90,000 values, **no collision retry**. On collision the `INSERT` throws `QueryException`; because `ingest()` wraps everything in `DB::transaction` (`:47`), the whole intake rolls back and the caller returns a generic error.
**Reproduction:** 1. System holds N leads. 2. A visitor submits the hero Quick-Lead form; `rand(10000,99999)` collides with probability ≈ N/90000 (birthday effect makes a collision near-certain well before the space fills). 3. Collision → unique violation → transaction rollback → visitor sees "Please try again," **the lead is never stored.**
**Impact:** Direct loss of inbound leads at a rate that grows with the table (~5.5% per submit at 5k leads, ~22% at 20k). Intermittent and invisible. Frequency: **common and worsening.**
**Recommendation:** Generate from a guaranteed-unique source (DB sequence / post-insert `id`, or a retry-on-unique loop like the existing `generateTrackingCode()`). Centralize in one place (model `creating` hook, next to `tracking_code`).
**Effort:** Small

### [High] `Lead::max('id') + offset` scheme: read-then-write race + deterministic cross-path collisions (`+1000` vs `+1001`)  ✅ *code-verified*
**Location:** `app/Http/Controllers/Portal/ImmigrationController.php:728,790` (`+1000`); `app/Http/Controllers/LeadController.php:2297` and `app/Http/Controllers/Portal/EducationController.php:498` (`+1001`); `app/Traits/CreatesDashboardLead.php:106` (`+1001`, set *after* insert)
**Description:** Several staff paths build `lead_id` as `'LP-'.str_pad(Lead::max('id') + <offset>, ...)`. (a) **Race** — `max('id')` is read outside any lock; two concurrent creates read the same max and mint the same `lead_id`. (b) **Deterministic offset mismatch** — immigration adds **1000**, import/education add **1001**, and `CreatesDashboardLead` adds 1001 *after* the row exists (so its `max('id')` already includes itself → effective `id+999`/`+1000`/`+1001`). All share one unique column, so a lead minted by one scheme collides with the number another scheme computes for a neighbouring `id`.
**Reproduction:** 1. Import a CSV (`+1001`); last lead gets actual `id=600`, `lead_id=LP-01600`. 2. An immigration adviser converts a ResidentIntake without a matching lead (`ImmigrationController:728/790`, `+1000`) → computes `600+1000 = LP-01600` for the new row (actual id 601) → **same `LP-01600`**. 3. `INSERT` hits the unique constraint; the enclosing `DB::transaction` rolls back → adviser sees "Could not convert this assessment," conversion silently fails.
**Impact:** Immigration case conversions fail intermittently (guaranteed right after any `+1001`-path lead); concurrent creates race and drop leads/conversions.
**Recommendation:** Same fix as §3-H1 — one atomic generator; never derive a human ref from `max('id')`.
**Effort:** Small

### [Medium] Booking creation never re-checks slot availability → double-booking race; "taken" set is global, not per-consultant
**Location:** `app/Http/Controllers/BookingController.php:44-58`; `app/Services/SlotGenerator.php:37-43`
**Description:** `SlotGenerator` removes taken `(date,time)` cells **only at display time**. `store` accepts the client-supplied `appointment_date`/`appointment_time` and does an unconditional `Booking::create` with no re-validation and no DB uniqueness guard. Two visitors who load the calendar together can both submit the same slot. Separately, `$taken` keys on `date+time` only (`:42`), so one booking blocks that wall-clock slot for *every* consultant.
**Reproduction:** Two visitors open `/book`, both see 10:00 Tue free, both submit → two confirmed bookings for the same consultant/time; no error.
**Impact:** Overlapping consultations; over-blocking of other consultants. Frequency: low-moderate, customer-facing.
**Recommendation:** Re-query the slot inside `store()` (ideally `select ... for update` / unique index on consultant+`appointment_at`) and reject if taken; add consultant scoping to `$taken`.
**Effort:** Medium

### [Medium] CSV lead import misparses day-first dates (`Carbon::parse` assumes US `m/d/Y`)
**Location:** `app/Http/Controllers/LeadController.php:2408-2419` (`parseDate`), used for `dob` (`:2182`) and `calendar_date` (`:2192`)
**Description:** `parseDate` calls `Carbon::parse($s)` on raw CSV cells. PHP interprets slash-delimited `nn/nn/YYYY` as **month/day** (US); NZ sheets are day-first. `05/06/2026` (6 June NZ) stores as **5 June**; `13/05/2026` throws (month 13) and is swallowed to `null`.
**Reproduction:** Import a CSV with `Date of Birth = 04/03/2000` (4 March NZ) → stored `2000-03-04` (wrong). Downstream `age` accessor (`Lead.php:454`) and eligibility scoring use the wrong date.
**Impact:** Silent DOB/calendar-date corruption on every day-first import; no error shown. Affects eligibility + age gating.
**Recommendation:** Parse with an explicit expected format (`createFromFormat('d/m/Y', ...)` with fallbacks) or require ISO in the template.
**Effort:** Small

### [Medium] `moveToProperty` not atomic; `markVacated` stamps `ended_at = now()` ignoring the entered vacate date
**Location:** `app/Http/Controllers/Portal/Accommodation/TenantController.php:139-158` (markVacated), `177-199+` (moveToProperty)
**Description:** `moveToProperty` closes the current tenancy (`current_status='vacated'`, `save()`), then `Tenant::create(...)` for the new property — **no `DB::transaction`**. If the second write fails, the old tenancy is left vacated with no replacement. Separately, `markVacated` records the staff-entered `vacate_date` only in a note but sets authoritative `ended_at = now()` (`:153`), whereas `moveToProperty` uses `Carbon::parse($move_date)` (`:184`) — inconsistent, so a back/forward-dated vacate produces an `ended_at` disagreeing with the recorded date. *(Rent-roll impact inferred.)*
**Reproduction:** Staff mark a tenant vacated with `vacate_date = 2026-07-01` on 2026-07-14 → `ended_at` saved 2026-07-14; note says "Vacated on 2026-07-01." Period math keyed on `ended_at` over-counts ~2 weeks.
**Impact:** Orphaned tenancy on partial failure; wrong end boundary. Edge but data-integrity.
**Recommendation:** Wrap `moveToProperty` in `DB::transaction`; set `markVacated` `ended_at = Carbon::parse($data['vacate_date'])`.
**Effort:** Small

### [Low] Lead can be archived while holding a signed agreement / active immigration case, no guard
`app/Http/Controllers/LeadController.php:2002-2017` — `destroy()` soft-deletes unconditionally (no check for `is_immigration_case`, active `Agreement`, or paid `Booking`). Reversible (`restore()` at 2043), but an in-progress case silently drops from every list. Warn/confirm when active case/signed agreement exists. **Effort:** Small

### [Low] `Agreement::STATUS_EXPIRED` is unreachable — "sent" agreements never expire, stay signable indefinitely
`app/Models/Agreement.php:26`; sign guard `TrackerAgreementController.php:80-84` checks status ∈ {sent, viewed} only. The `agreements` table has **no `expires_at`** and no scheduler flips to `expired`, so an agreement emailed months ago is signable forever. Add `expires_at` + scheduled transition, or drop the unused status. **Effort:** Medium

### [Low] `BookingController::update` accepts an arbitrary `status` string
`app/Http/Controllers/BookingController.php:83-96` — `status` validated only `nullable|string|max:50`; an admin can set a paid/`Confirmed` booking to any free-text value, no allow-list/transition check. (Payment fields untouched → no financial corruption.) Constrain with `Rule::in([...])`. **Effort:** Small

---

## Section 4: Data Integrity Bugs

Schema/code claims below are VERIFIED against migrations + controllers; row-count/drift *magnitude* is INFERRED (live DB rows not readable).

### [High] Lead-portal login email drifts from lead email; password-reset hands out wrong credentials  ✅ *code-verified*
**Location:** `app/Http/Controllers/LeadPortalInvitationController.php:213,264,299-329`; `app/Http/Controllers/LeadController.php:1689-1699` (`updatePersonal` writes lead `email`, no `portalUser` sync). Grep confirms no `portalUser` email write anywhere (`:47` only eager-loads `portalUser:id,lead_id,last_login_at`).
**Description:** The portal `User` row is created with a **snapshot** of `lead->email` at credential-generation time. The lead's email is independently editable via `updatePersonal` (and the assessment/quick-capture update paths at 298/437/593/917). Nothing propagates a later email change to the linked `User.email` (the actual login credential). Worse, `resetPassword` (`:327-329`) flashes `'email' => $lead->email` as "the credentials to copy," so an admin resetting a client whose email was edited copies an address that will **not** authenticate.
**Reproduction:** 1. Admin generates portal credentials (`User.email = old@x.com`). 2. Staff correct the lead's email to `new@x.com` (`leads.email` updated; `users.email` unchanged). 3. Admin clicks "Reset password" → toast shows `new@x.com` + new password; admin sends those to the client. 4. Client logs in with `new@x.com` → auth fails (real login still `old@x.com`); the portal even displays `new@x.com` on the profile, deepening confusion.
**Impact:** Client locked out; support hands out non-working credentials. Frequency: only leads with an existing portal account whose email is later edited — rare precondition, severe and silent when hit.
**Recommendation:** On lead email change, sync `portalUser->email` (guard the `users.email` unique collision); or make `resetPassword`/`generateCredentials` read/display `portalUser->email` and warn when the two differ.
**Effort:** Small

### [Medium] Soft-deleted (archived) leads still inflate English class `enrolled_count` and appear as "Unknown" learners
**Location:** `app/Http/Controllers/Portal/EnglishController.php:240,244-245`; FK `english_class_enrollments.lead_id ... cascadeOnDelete()` (`2026_06_14_120000_...:31`); Lead `SoftDeletes` (`Lead.php:15`)
**Description:** Children use DB-level `cascadeOnDelete`, but Lead is **soft-deleted** (`destroy:2007`, `bulkDelete:565` both `->delete()`, never `forceDelete`). A DB cascade never fires on a soft delete, so enrollment rows survive. The roster eager-loads `enrollments.lead`; the SoftDeletes global scope makes `$e->lead` resolve `null` for archived leads. The map null-guards the *name* ("Unknown") but `enrolled_count` counts the raw relation → overstated capacity + ghost rows.
**Reproduction:** 1. Enroll student lead L in class C (`enrolled_count=1`). 2. Archive L. 3. Class C still shows `enrolled_count:1` with a roster row `name:"Unknown", email:null`.
**Impact:** Wrong roster/capacity counts; ghost rows. Display-level, not corruption. *(Inferred the same pattern hits any lead-child aggregate not joined to `leads` — e.g. task board `additional_lead_ids`, `english_assessments`; the enrollment path is verified end-to-end.)*
**Recommendation:** Constrain child counts/lists via `whereHas('lead')` or filter null-`lead` rows; or cascade-archive children in `destroy`.
**Effort:** Medium

### [Low] `event_sessions.registered_count` — dead denormalized counter (never written, never read)
`app/Models/EventSession.php:11` + its migration are the **only** references (whole-codebase grep). Neither maintained nor consumed; real counts derive live from `leads.event_session_id`. No bug today; a trap for future code that trusts it. **Extends Sub-audit 2's "write-only" flag** (it's actually neither written nor read). Drop it, make it an accessor, or maintain it. **Effort:** Small

### [Low] Inconsistent / missing FK constraints on several `*_id` / `*_by` columns
Bare `unsignedBigInteger` (no `->foreign()`): `leads.student_converted_by` (`2026_05_21_120000_...:20`), `leads.immigration_converted_by` + `accommodation_converted_by` (`2026_05_21_130000_...:25,29`) — **inconsistent** with `english_converted_by` which *is* constrained; `leads.event_notes_updated_by` (`2026_06_30_100000_...:29`); `case_audit_views.lead_id`/`viewer_id` (index only); `scheduled_event_emails.template_id` (no FK to `message_templates`). (`message_logs.recipient_id`, `ai_record_analyses.record_*` are polymorphic → correctly no FK; `accommodation_tenants.converted_from_viewer_id` is a documented placeholder.) On hard user-delete these silently orphan; `belongsTo` accessors degrade to null (graceful). Add `->constrained('users')->nullOnDelete()` for consistency; decide/document `case_audit_views` intent. **Effort:** Medium (needs backfill/validation before constraining existing columns)

### [Low] `agent_id` denormalization drifts when an event's agent is reassigned
`app/Http/Controllers/EventController.php:387-388` back-fills only leads whose `agent_id` is **null** on event update, and `:572` copies event `agent_id` at registration. If an event's agent changes A→B after some leads registered, those keep A while new registrants get B — split attribution, no UI signal. May be intentional; decide + document the rule. **Effort:** Small

### [Low] Lead-id JSON arrays are unconstrained snapshots not cleaned on archive
`lead_tasks.additional_lead_ids`, `email_campaigns.recipient_lead_ids`, `scheduled_event_emails.recipient_ids` — all `json`, no referential integrity. For campaigns/scheduled emails this is a deliberate frozen snapshot (correct). For `lead_tasks.additional_lead_ids` a soft-deleted lead id lingers and resolves to nothing while occupying a slot (same root cause as the §4 Medium). Filter secondary leads through the SoftDeletes scope when rendering. **Effort:** Small

---

## Section 5: Frontend Bugs

Frontend is defensively written (both kanban boards do optimistic-with-rollback correctly; social Inbox poller uses refs to dodge stale closures; `GlobalSearchBar` aborts in-flight fetches; every traced `useForm` submit disables on `processing`). No value-corruption bug — `booking.amount` is `decimal:2` dollars so `PaymentResult`'s `toFixed(2)` is correct. Defects are in presentation consistency + incomplete async states.

### [Medium] Inconsistent currency formatting across money displays (no thousands separators, mixed decimals/prefixes)
**Location:** `resources/js/components/accommodation/useViewingBooking.js:21`; `pages/accommodation/AccommodationPage.jsx:36`; `pages/accommodation/PropertyDetails.jsx:18`; `pages/portal/accommodation/{Dashboard.jsx:25,Tenants.jsx:18,RentUtilities.jsx:6,TenantForm.jsx:168}`; `pages/admin/Immigration/ResidentIntakes.jsx:189`; `pages/booking/PaymentResult.jsx:72`
**Description:** No shared money formatter. The accommodation `money()` helper is defined ~5 times, most as `` `$${Number(v).toFixed(0)}` `` (no decimals, **no thousands separators**), while `RentUtilities`/`TenantForm` use `toFixed(2)`, `PaymentResult` prefixes `NZD $`, `ResidentIntakes` shows `$25.00/hr`. None use `Intl.NumberFormat`/`toLocaleString`, so a bond of 12000 renders `$12000` on a card but `$12000.00` on the ledger.
**Reproduction:** Open a property with a 5-figure bond → card shows `$12000`; that tenant's `RentUtilities`/`TenantForm` shows `$12000.00`. Same value, three renderings, large numbers ungrouped.
**Impact:** Every money-bearing accommodation/booking screen; misleading on financial figures + a 5-copy maintenance hazard. Not a wrong value.
**Recommendation:** One `formatMoney(v,{currency:'NZD'})` in `resources/js/lib` using `Intl.NumberFormat('en-NZ',{style:'currency',currency:'NZD'})`; replace the ad-hoc helpers.
**Effort:** Small

### [Medium] Assessment result "processing" screen never resolves on its own — manual refresh only
**Location:** `resources/js/pages/free-assessment/AssessmentResult.jsx:9-11,168-192`
**Description:** After a free-assessment submit the AI analysis is queued (`processing`). `AssessmentResult` renders `ProcessingState` — an infinite spinner + a "Refresh Status" button calling `window.location.reload()`. There is **no auto-poll / interval / `router.reload` timer**, so a user sits on a spinning loader indefinitely unless they click Refresh. The copy ("usually takes less than a minute") makes a non-updating spinner read as hung. **Compounds with §1 (job can hang) — together a permanent dead-end.**
**Reproduction:** 1. Submit the free assessment. 2. Get redirected to `/assessment-result/{id}` while the job runs. 3. The spinner never advances even after the job completes server-side; only a manual reload reveals the score.
**Impact:** Every submitter whose job hasn't finished at redirect time (the normal case, since analysis is async). High-visibility public funnel; looks broken.
**Recommendation:** Bounded poller in `ProcessingState` (`setInterval(() => router.reload({only:[...]}), 4000)` with a max-attempts cap, cleared on unmount/when status leaves `processing`); keep the manual button as fallback.
**Effort:** Small

### [Low] `PaymentResult` "Pay now" retry: no in-flight disable, silent failure
`pages/booking/PaymentResult.jsx:16-30,78-82` — `retry()` POSTs to `retryUrl`, redirects only on `res.ok && data.url`; the button has no `disabled`/loading state (double-click → two checkout sessions) and the `catch`/else path is silent (no toast). Add a `busy` guard + error toast. **Effort:** Small

### [Low] `LeadMultiPicker` search has no request cancellation — stale results can overwrite fresh
`components/task-board/LeadMultiPicker.jsx:35-50` — debounces but never aborts the `fetch` (unlike `GlobalSearchBar`), so a slow earlier response can `setResults` over a newer one; `.finally` clears loading while a newer request is outstanding. Mirror `GlobalSearchBar`'s `AbortController`. **Effort:** Small

### [Low] `FreeAssessmentPage` error-clearing effect reads `errors`/`localErrors`/`clearErrors` but depends only on `[data]`
`pages/free-assessment/FreeAssessmentPage.jsx:403-428` (mirror in `EducationEnrolmentPage.jsx:313-325`) — stale-closure risk if server `errors` update without a `data` change on the same tick; self-corrects on next keystroke (narrow window). Add `errors`/`localErrors` to deps. **Effort:** Small

### [Low] `setState` after unmount in async submit/autosave paths (no cancel guard)
`components/accommodation/useViewingBooking.js:84-123`; `components/ui/ChatBot.jsx:127-163`; `pages/free-assessment/EducationEnrolmentPage.jsx:385-407` — `setState` in resolve/`finally` with no is-mounted/Abort guard. Benign under React 19 (no warning, no corruption); noted for completeness. Track mounted ref / `AbortController`. **Effort:** Small

---

## Section 6: Money, Timing, and Side-Effect Bugs

**Money is handled correctly** (Verified-OK). The defects are timing/idempotency.

### [High] Bulk campaign & event-email jobs can double-send: `timeout` exceeds queue `retry_after`  ✅ *code-verified*
**Location:** `app/Jobs/SendCampaign.php:25` (`$timeout = 600`), `app/Jobs/SendScheduledEventEmail.php:24` (`$timeout = 300`) vs `config/queue.php:42,70` (`retry_after` default **90** for both `database` and `redis`)
**Description:** The queue reserves a job for `retry_after` seconds; if it hasn't reported completion in that window, the job becomes available again and **a second worker starts a copy while the first still runs**. Laravel's rule is `timeout` < `retry_after`; here it's inverted (600/300 vs 90). Neither job sets `$tries`, `ShouldBeUnique`, `WithoutOverlapping`, or per-recipient dedup — the only guard (`SendCampaign.php:32`) skips *only* `SENT`/`CANCELED`, but during overlap the status is still `SENDING`, so the second copy re-iterates every recipient. `SendCampaign`'s SMS path (synchronous provider call per lead, `CommunicationService.php:233`) is the slowest and most exposed.
**Reproduction:** 1. Schedule an SMS campaign to ~400 leads. 2. `campaigns:dispatch-due` claims it `SENDING` and dispatches `SendCampaign` once. 3. `handle` loops leads calling the SMS provider synchronously (~0.5s each ⇒ ~200s), exceeding 90s. 4. At ~90s the queue re-reserves; a second worker runs `handle` again — status still `SENDING`, passes the guard, re-sends from the top. → Every lead receives the SMS **twice+**; `sent_count` is overwritten by whichever copy finishes last.
**Impact:** Duplicate mass SMS/email — direct Twilio cost + spam/reputation damage. Triggers on any blast that fans out longer than 90s (routine for large lists). Frequency: **common on large campaigns.**
**Recommendation:** Set each job's `timeout` below `retry_after` (or raise `*_QUEUE_RETRY_AFTER` above max runtime), and make the fan-out idempotent (mark each recipient in `MessageLog` before send and skip already-logged on re-entry; or `WithoutOverlapping`/`ShouldBeUnique` keyed on campaign id).
**Effort:** Medium

### [Medium] Stripe webhook marks booking paid on `checkout.session.completed` without checking `payment_status`
**Location:** `app/Http/Controllers/PaymentController.php:88-91` (webhook) vs `:106` (success path)
**Description:** The webhook marks the booking paid the moment it sees `checkout.session.completed`, passing the session to `markPaid` with no `$session->payment_status` check. The success-return path (`:106`) correctly gates on `payment_status === 'paid'`. For card payments `completed` implies `paid` (latent today), but if any async/delayed method is enabled (bank debit, some wallets), `completed` fires while `payment_status` is `unpaid` → booking marked `paid`/`Confirmed` and the invoice email goes out **before funds capture**; no `async_payment_failed` handler reverses it.
**Reproduction:** (async method only) 1. Customer checks out via delayed-capture. 2. Stripe sends `completed` with `payment_status='unpaid'`. 3. Webhook calls `markPaid` unconditionally → `Confirmed`, invoice emailed. 4. Payment later fails; booking stays paid.
**Impact:** Premature paid/confirmed + invoice for uncaptured payments. Zero for card-only accounts, guaranteed for async methods. *Inferred (depends on Stripe account config).*
**Recommendation:** Gate the webhook `markPaid` on `$session->payment_status === 'paid'` (mirror the success path); add `async_payment_succeeded`/`_failed` handlers.
**Effort:** Small

### [Medium] `markPaid` read-then-write race can double-send the booking confirmation email
**Location:** `app/Http/Controllers/PaymentController.php:139-155`, reached from both `webhook` (`:90`) and `success` (`:107`)
**Description:** `markPaid` is not atomic: it reads `payment_status`, and if not paid, updates + queues `BookingConfirmationMail`. Stripe redirects the browser to `success_url` while the `checkout.session.completed` webhook fires ~simultaneously, so both entry points can run concurrently, both read `unpaid`, both pass the guard, both update + queue the email. No DB lock / conditional `UPDATE ... WHERE payment_status <> 'paid'` / unique constraint serializes them. **Cross-investigator nuance:** §3 marked `markPaid` "idempotent" because the `!== PAYMENT_PAID` guard exists — true single-threaded, but the guard is defeated by concurrency, which is the actual bug here.
**Reproduction:** 1. Complete a Stripe Checkout. 2. Stripe hits `/stripe/webhook` and redirects to `/booking/payment/success` near-simultaneously. 3. Both enter `markPaid` before either commits `paid`. → Client receives **two** confirmation/invoice emails; `LogsActivity` records it twice.
**Impact:** Duplicate confirmation/invoice emails + duplicate audit entries. Per-booking blast radius; window hit whenever webhook and success land together (common).
**Recommendation:** Make the transition atomic — `$affected = Booking::where('id',$id)->where('payment_status','!=',PAYMENT_PAID)->update([...]); if ($affected) { …queue email… }`, or `lockForUpdate` in a transaction.
**Effort:** Small

### [Low] Campaign/event `sent_count` counts *queued/accepted*, not *delivered*
`app/Services/CommunicationService.php:207-209` (email true whenever log `!= FAILED`, status `QUEUED` at `:264`) and SMS `:238-244` (true on provider *accept*). `SendCampaign` tallies `sent++` at queue/accept time; real delivery failures aren't reflected. **Same root cause as §1's stuck-`queued` finding (multi-investigator).** Relabel as "accepted/queued" or reconcile from `MessageLog` delivery status. **Effort:** Medium

### [Low] `CerebrasService` stores loosely-validated LLM JSON
`app/Services/CerebrasService.php:349-355,360-376` — `extractJson` falls back to first-`{`…last-`}` (grabs wrong span on prose with stray braces); `analyze()` asserts only that top-level `overall_score`+`categories` exist, not that `categories.*` have numeric in-range `score`/`max`. Malformed-but-parseable output is stored `completed` and the frontend trusts the structure. `AnalyzeLeadAssessment` already retries + marks `failed` on hard parse errors, so blast radius is small. Validate nested shape/ranges before persisting. **Effort:** Small

---

## Appendix A: Prior Audits Cross-Referenced

| This audit | Prior audit / finding | Relationship |
|---|---|---|
| §4-Low dead `registered_count` | Sub-audit 2 §2-L8 (flagged "write-only") | Extended: it's neither written nor read |
| §3 lead_id generation (H1/H2) | Sub-audit 1 §2-L2 (`max('id')+1` collision risk) | Confirmed + quantified the `rand()` and offset-mismatch variants as correctness bugs |
| §6 `markPaid` / Stripe idempotency | Sub-audit 2.5 §3 (GET `/payment/success` triggers `markPaid`) | Routing already flagged; here the **logic** race within it |
| §5/§6 assessment funnel | Sub-audit 1 (Cerebras/`ai_analysis` handling) | Correctness angle: fake-`completed` drafts + stuck `processing` + no auto-poll |
| §2/§4 lead ↔ portalUser / draft data | — | New (correctness) |

**Note:** the investigator for §4 could not see the untracked `SYSTEM_AUDIT_1/2/2.5` files in `docs/audits/` (they are present but unstaged in this working tree); that cross-referencing was done by the synthesizer, who has their contents.

## Appendix B: Confidence and Gaps

**Verified (read against source):** all 5 High findings were cross-verified at the cited lines — dashboard score key (`SuperAdminDashboardController.php:78` reads `eligibility_score`/`score`; `CerebrasService.php:349/458` writes `overall_score`); `rand()` lead_id (`LeadIntakeService.php:102`); the `+1000`/`+1001` offset split (5 sites confirmed via grep); `SendCampaign` timeout=600 vs `retry_after`=90 (`config/queue.php:42,70`); portal-email drift (no `portalUser` email write exists). Money storage/Stripe cents verified correct.

**Inferred (not directly observable):**
- Live-DB drift *magnitude* — how many leads currently have `email ≠ portalUser.email`, archived-lead enrollment ghosts, or lead_id collisions already suffered — cannot be counted from code alone.
- §6 Stripe async-method finding depends on the Stripe account's enabled payment methods (not in repo).
- The English-roster soft-delete pattern is verified end-to-end; its extension to the task board / `english_assessments` is inferred from the same mechanism.

**Sub-checks not exhaustively completed (time budget):**
- §1: PLAI/Zernio per-request HTTP internals (boundary handling confirmed; line-by-line not read — PLAI is dormant).
- §2: full enumeration of every `$request->input()` site across all portal controllers (spot-checked, the one bad case is `saveAssessmentDraft`); every `Inertia::render` prop array for other unguarded nullable strings.
- §3: broad timezone sweep of every `now()`/`diffForHumans()` in email/report code (highest-risk surfaces spot-checked; `SlotGenerator` is the only Auckland re-anchor, so any future NZ-wall-clock-vs-UTC deadline compare is a latent bug).
- §5: line-audit of per-row optimistic toggles in the ~30 CRUD admin/portal list pages (grep sweep clean; not each one read).

## Appendix C: Reproduction Scenarios (Critical / High)

**§3-H1 — `rand()` lead_id collision (silent lead loss)**
1. System holds N leads (each occupying an `LP-#####` slot).
2. Visitor submits the hero Quick-Lead form → `createNew` rolls `rand(10000,99999)`; P(collision) ≈ N/90000.
3. Collision → unique-constraint violation → `DB::transaction` rollback → visitor sees "Please try again."
4. **Observed:** the lead is never stored; no row to notice missing. Rate rises with table size.

**§3-H2 — `max('id')+offset` cross-scheme collision (conversion fails)**
1. Import a CSV (`+1001` path); last lead: actual `id=600`, `lead_id=LP-01600`.
2. Immigration adviser converts a ResidentIntake without a matching lead (`ImmigrationController:728`, `+1000`) → computes `600+1000 = LP-01600` for new row (actual id 601).
3. **Observed:** `INSERT` hits the unique constraint → transaction rollback → "Could not convert this assessment." Conversion silently fails; guaranteed right after any `+1001`-path lead.

**§6-H — Bulk job double-send**
1. Schedule an SMS campaign to ~400 leads.
2. `SendCampaign::handle` loops the provider synchronously (~0.5s/lead ⇒ ~200s > 90s `retry_after`).
3. At ~90s the queue re-reserves the job; a second worker re-enters `handle`; status still `SENDING` → passes the guard → re-sends from the top.
4. **Observed:** every lead receives the SMS twice or more; `sent_count` clobbered by the last finisher.

**§2-H — Dashboard eligibility always `<30`**
1. Analyze several leads (`ai_analysis.overall_score` = 85, 72, …).
2. Open the SuperAdmin dashboard.
3. **Observed:** distribution shows `<30 = N`, every other tier `0`, regardless of real scores — because `$data['eligibility_score'] ?? $data['score'] ?? 0` always falls to 0.

**§4-H — Portal-login email drift**
1. Admin generates portal credentials (`User.email = old@x.com`).
2. Staff edit the lead's email to `new@x.com` (`leads.email` changes; `users.email` unchanged).
3. Admin clicks "Reset password" → toast shows `new@x.com` + new password; admin sends those to the client.
4. **Observed:** client logs in with `new@x.com` → auth fails (real login still `old@x.com`); the portal profile even displays `new@x.com`.

---

*End of System Bug Audit. Report is uncommitted and untracked; no source files were modified.*
