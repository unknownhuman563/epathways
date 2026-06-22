# Lead Portal Deep-Dive Audit

**Date:** 2026-06-19
**Branch:** `angi`
**Scope:** The client-facing lead portal (`/portal/lead/*`) and the related public tracker (`/track/{code}`). Investigation only — no code changed.
**Method:** Read `routes/web.php`, `config/auth.php`, `AuthController`, `LeadPortalController`, `LeadDocumentController`, `LeadTrackingController`, `LeadPortalInvitationController`, the `resources/js/pages/portal/lead/*` components, `LeadLayout.jsx`, and `php artisan route:list`.

Status legend: ✅ works · ⚠️ partial · ❌ stub/placeholder · 🔓 security note

---

## Section 1 — Lead authentication flow

| Question | Finding |
|---|---|
| How does a lead log in? | **Email + password**, through the same login form as staff. [`AuthController::login`](../../app/Http/Controllers/AuthController.php#L32) → `Auth::attempt(['email','password'])` (L69) → redirects to `User::homeRoute()` which sends a `lead`-role user to `/portal/lead/dashboard`. |
| Separate guard for leads? | **No.** Single `web` guard, single `users` table. [`config/auth.php:17`](../../config/auth.php#L17) `'guard' => env('AUTH_GUARD','web')`. Leads are `User` rows with `role = 'lead'`, gated by the `portal:lead` middleware, not a separate guard. |
| Route prefix | `/portal/lead/*` (inside the global `auth` group → `Route::prefix('portal')` → `Route::middleware('portal:lead')->prefix('lead')`), [`routes/web.php:781`](../../routes/web.php#L781). |
| Self-register? | **No.** There is no public lead registration. A lead `User` row is created **only** inside the invitation `store()` flow ([`LeadPortalInvitationController` ~L211](../../app/Http/Controllers/LeadPortalInvitationController.php#L211) `User::create(...)`). |
| Magic link / tracking code login? | Not for the *logged-in* portal. The tracking code is a separate, no-login flow (see Section 7). |

### Invitation lifecycle (invite-based access)

State lives on **columns of the `leads` table** (`portal_invitation_status`, `portal_invitation_token`, `portal_invitation_expires_at`) — there is **no** `LeadPortalInvitation` *model*; `App\Mail\LeadPortalInvitation` is the **Mailable**. Documented flow ([`LeadPortalInvitationController` header L18-22](../../app/Http/Controllers/LeadPortalInvitationController.php#L18)):

| Step | Method | Effect |
|---|---|---|
| Sales requests | `request()` (L60) | `status = pending` |
| Admin approves | `approve()` (L87) | `status = sent`; plain token emailed, **sha256 hash** stored; **`expires_at = now + TOKEN_TTL_DAYS` (7 days)**; `Mail::to($lead->email)->send(new LeadPortalInvitation(...))` (L108) |
| Admin rejects | `reject()` (L128) | back to `none` |
| Admin revokes | `revoke()` (L147) | `sent`/`accepted` → `revoked`, token cleared |
| Lead completes setup | `setup()` (L176) / `store()` (L196) | password set, `User` row created, `status = accepted`, auto-login |

- **Token is single-use and expires in 7 days.** `store()` rejects an expired/used token (L205 "This invitation has expired or been used.").
- **`portal_invitation` Mailable still wired:** ✅ — dispatched in `approve()`. Whether it actually *delivers* depends on the mail driver (dev default is `MAIL_MAILER=log`, so it's written to the log, not sent). Admin can also surface a one-time `invitation_link` / `generated_credentials` via flash (shared in `HandleInertiaRequests`) as a manual fallback.
- 🔓 Approval is a **manual admin bottleneck** — sales can only *request*; an admin must approve before the lead can log in.

---

## Section 2 — Lead portal route map

All routes below require `auth` + `portal:lead`. None take a lead `{id}` — every handler resolves the caller's own record via `$user->lead` (see Section 3). Source: [`routes/web.php:781-807`](../../routes/web.php#L781).

| Method | URL | Controller method | Component | Description | Status |
|---|---|---|---|---|---|
| GET | `/portal/lead/dashboard` | `LeadPortalController@dashboard` | `portal/lead/Dashboard` | Hero, submissions counts, next activity, latest announcement, document summary, roadmap/phase | ✅ |
| GET | `/portal/lead/journey` | `@journey` | `Journey` | Vertical roadmap timeline (`LeadPhaseService`) + submissions timeline | ✅ |
| GET | `/portal/lead/submissions` | `@submissions` | `Submissions` | Chronological history (assessment, bookings, event reg) | ✅ |
| GET | `/portal/lead/checklist` | `@checklist` | `Checklist` | Read view of `document_checklist` + `section_verifications` | ✅ (read-only view) |
| GET | `/portal/lead/documents` | `LeadDocumentController@leadIndex` | `Documents` | Requested docs, staff-shared files, checklist uploads, section state | ✅ |
| POST | `/portal/lead/documents/upload` | `@leadUpload` | — | Upload one file (optionally against a request) | ✅ |
| POST | `/portal/lead/documents/checklist/{key}/upload` | `@leadChecklistUpload` | — | Upload 1–10 files against a checklist item | ✅ |
| POST | `/portal/lead/documents/section/{key}/submit` | `@leadSubmitSection` | — | Flip a checklist section to `in_review` | ✅ |
| POST | `/portal/lead/documents/agreements/acknowledge` | `@leadAcknowledgeAgreements` | — | Tick "I agree" → sets/clears timestamp | ✅ |
| GET | `/portal/lead/documents/{docId}/download` | `@download` | — | Download/inline a doc (scoped) | ✅ |
| GET | `/portal/lead/appointments` | `@appointments` | `Appointments` | Bookings matched by `email` (upcoming/past) | ✅ (read-only; no self-booking) |
| GET | `/portal/lead/activities` | `@activities` | `Activities` | Public events (upcoming/past) | ✅ |
| GET | `/portal/lead/announcements` | `@announcements` | `Announcements` | Facebook Lives + NZ migration news | ✅ |
| GET | `/portal/lead/profile` | `@profile` | `Profile` | Personal details (display) + avatar upload | ⚠️ read-only (avatar editable; password/2FA "coming soon") |
| GET | `/portal/lead/visa-forms` | `@visaForms` | `VisaForms` | 6-section visa wizard | ❌ stub |
| GET | `/portal/lead/proposals` | `@proposals` | `Proposals` | Pathway proposal review/decision | ❌ stub |
| GET | `/portal/lead/agreements` | `@agreements` | `Agreements` | E-signature of engagement agreements | ❌ stub |
| GET | `/portal/lead/payments` | `@payments` | `Payments` | Payment plan / history / balance | ❌ stub |
| GET | `/portal/lead/messages` | `@messages` | `Messages` | Two-way threads with staff | ❌ stub |
| GET | `/portal/lead/settings` | `@settings` | `Settings` | Notification prefs / language / data controls | ❌ stub |

**Not in the sidebar but reachable:** `Notifications.jsx` (the topbar bell renders for leads via `DashboardLayout`; `NotificationController::index` maps a lead to `portal/lead/Notifications`). The audit's nine named pages map as: Dashboard ✅, Documents ✅, Messages ❌, Proposals ❌, Agreements ❌, Payments ❌, Settings ❌, VisaForms ❌, Profile ⚠️.

---

## Section 3 — Lead-side data scope

🔓 **Scoping is sound.** No lead-portal route accepts a lead `{id}` — every controller method calls `resolveLeadOrLogout()` / `$user->lead` ([`LeadPortalController:205`](../../app/Http/Controllers/LeadPortalController.php#L205)) and reads only that record. So **`/portal/leads/43/documents` does not exist as a URL** — there is no id-parameterised lead route to abuse.

- **The one id-bearing route**, `GET /documents/{docId}/download`, is explicitly scoped: [`LeadDocumentController:523`](../../app/Http/Controllers/LeadDocumentController.php#L523) `if ($user->isLead()) abort_unless($user->lead_id === $doc->lead_id, 403);` → a lead cannot download another lead's file.
- **Upload-against-request** verifies ownership: `leadUpload` aborts 403 if the `request_id` doesn't belong to the lead ([L490-495](../../app/Http/Controllers/LeadDocumentController.php#L490)).
- **What the lead sees:** own personal payload (`leadPayload`, L220 — name/email/phone/country/stage/status), own documents/requests/staff-shared files, own checklist + section state, bookings matched by their email, and **public** content (events, Facebook Lives, news) shared across all leads.
- **What the lead does *not* see:** internal staff notes (`LeadNote`), tags, tasks, activity logs, AI analyses, other leads. None are queried by `LeadPortalController`.
- ⚠️ **Minor caveat:** Appointments and booking matching are by **email string** (`Booking::where('email', $lead->email)`), not FK — correct in practice but coupled to email consistency.

---

## Section 4 — Document flow (lead-side)

✅ Working and reasonably complete.

- **How a lead knows what to upload:** two surfaces. (a) **Staff-created requests** — `LeadDocumentRequest` rows (`label`, `description`, `required`) surface on the Documents page (`leadIndex`, L333). (b) **Checklist items** — a fixed structure from the frontend constant `@/data/leadDocumentChecklist` (`CHECKLIST`), with per-lead state in the `leads.document_checklist` JSON column + `section_verifications`.
- **Where the checklist comes from:** **hybrid** — fixed item set in frontend code; per-lead status in JSON on the lead. It is **not** per-visa-type configurable (cf. the "Checklist Templates" stub in the staff portals).
- **Upload:** `leadChecklistUpload` accepts **1–10 files**; `leadUpload` a single file. Stored on the configured disk under `lead-documents/{lead_id}`.
- **Allowed types / size:** [`UploadValidation::document()`](../../app/Support/UploadValidation.php#L34) → `mimes: pdf,jpg,jpeg,png,doc,docx,xls,xlsx`, **max 20 MB** (`DOCUMENT_MAX_KB = 20480`).
- **Status lifecycle:** `Submitted → UnderReview → Approved / Rejected` (+ `StaffShared` for staff→lead files). Constants on `LeadDocument`.
- **Notifications on submit:** when a lead uploads, staff are notified in-app (`DocumentSubmittedForReview` to the assignee or admins, L460-476). **Status-change → lead** notifications are sent by the **staff** side (`DocumentStatusChanged` mailable / `doc_approved`/`doc_rejected` templates via `CommunicationService`) — email/SMS, subject to mail driver.
- **Can a lead replace a rejected doc?** Yes — they can upload again against the same checklist key/request (new `LeadDocument` rows; nothing blocks re-upload). On the **tracker** side there's an explicit `is_editable` guard (only while `Submitted`); the portal side simply allows new uploads.
- **Can a lead see the rejection reason?** ✅ Yes — `docSerialize` returns `note` (L555), so the staff rejection note is visible to the lead.
- ❌ **Gaps:** no document **expiry** tracking (no `expires_at` on `LeadDocument`), no automated **reminders/chase** for outstanding docs, no per-visa-type checklist.

---

## Section 5 — Message / communication (lead-side)

❌ **No lead-side messaging exists.**

- **See sent emails/SMS?** No. `message_logs` is **not consumed anywhere in `LeadPortalController`** — it's a staff-side audit trail only.
- **Send a message to staff?** No. `Messages.jsx` is a `ComingSoonPanel` ([`resources/js/pages/portal/lead/Messages.jsx`](../../resources/js/pages/portal/lead/Messages.jsx)) describing a future "thread per staff member" feature.
- **What bridges lead ↔ staff today:** ordinary **email/phone outside the portal**. Staff send templated/ad-hoc email via `CommunicationService` (logged to `message_logs`); the lead replies by normal email. The portal is one-directional (lead uploads; staff review).
- Ironically, the read-only **Profile** page tells leads to "Message your adviser" to change details — but the Messages page that would enable that is a stub.

---

## Section 6 — Lead self-update

⚠️ **Split across two experiences — and the logged-in portal is the weaker one.**

- **In the logged-in lead portal:** ❌ a lead **cannot** edit contact info, name, DOB, or passport. `Profile.jsx` is **display-only** ([`resources/js/pages/portal/lead/Profile.jsx`](../../resources/js/pages/portal/lead/Profile.jsx)) and explicitly says *"Need to update something? Message your adviser."* The only editable thing is the **avatar** (`AvatarUploader` → `/profile/avatar`). Password + 2FA are "Coming soon" (L54, L64). There is **no POST profile-update route** in the lead group.
- **In the public tracker:** ✅ a lead **can** self-edit a broad set of fields (see Section 7) — `first_name, middle_name, last_name, other_names, gender, marital_status, dob, email, phone, country_of_birth, place_of_birth, citizenship, residence_*, has_passport, passport_number, passport_expiry` ([`LeadTrackingController::EDITABLE` L40-47](../../app/Http/Controllers/LeadTrackingController.php#L40)).
- **Net effect:** self-service info update **does exist**, but only via the no-login tracker, not the authenticated portal. For a logged-in lead the current process is "email/ask staff, who edit it on the admin lead detail."

---

## Section 7 — Tracker portal vs lead portal

They are **two separate experiences** serving overlapping needs.

| | Tracker (`/track/{code}`) | Lead Portal (`/portal/lead/*`) |
|---|---|---|
| Auth | **None** — the `tracking_code` is the bearer credential ([`LeadTrackingController:23`](../../app/Http/Controllers/LeadTrackingController.php#L23)) | Login (email+password, invite-provisioned) |
| Component | `track/TrackingPage` (single page) | Full sidebar app (`LeadLayout`) |
| Info self-edit | ✅ broad allow-list (`update()` L97) | ❌ read-only Profile |
| Documents | ✅ upload/replace/delete (while pending), per-item status | ✅ upload + section submit (no delete) |
| Timeline | ✅ 7-step pipeline, or 12-step immigration journey for cases (L85) | ✅ roadmap/journey via `LeadPhaseService` |
| Extras | — | Dashboard, appointments, events, announcements, notifications |
| Access friction | Just need the code (sharable, low security) | Requires admin-approved invite |

- **Can a lead use the tracker without logging in?** ✅ Yes — only the code.
- **UX trade-off:** the tracker is **frictionless but less secure** (anyone with the code can edit info and documents) and **thinner**; the portal is **secured and richer** but needs an invite and **cannot self-edit info**. They were clearly built at different times and **overlap** (both do documents + timeline).
- **Does staff choose which to send?** ✅ Effectively yes — "Send Tracker Link" / "Copy Track Link" on the lead detail sends the **tracker**; the **invitation** flow provisions the **portal**. There is no single canonical "client link," which is a real product inconsistency.

---

## Section 8 — Stubs deep-detail

All six stubs render `ComingSoonPanel` ([component](../../resources/js/components/portal/ComingSoonPanel.jsx)) — a card headed **"Coming soon"** with a bulleted list of planned features. Controllers return only `['lead' => leadPayload]` (no real data).

| Page | File | Headline shown to leads | Backend already present? | Rough effort |
|---|---|---|---|---|
| **VisaForms** | `resources/js/pages/portal/lead/VisaForms.jsx` | "Your visa forms will live here" (6 sections: Personal, Education, Work, English, Family, Visa-specific; save-as-draft) | Partial — `LeadEducationExp`/`LeadStudyPlan` exist; resident-intake forms exist as a model. No draft-per-section storage. | **5–8 d** |
| **Proposals** | `Proposals.jsx` | "Your proposals will appear here" (view/PDF, decide proceed/thinking/decline) | None — no Proposal model/table. dompdf exists (used for agreements). | **4–6 d** |
| **Agreements** | `Agreements.jsx` | "Your agreements will appear here" (read in-browser, e-sign, download) | **Strong** — staff already generate agreement PDFs (`source='generated'`), and leads already **acknowledge** terms (`leadAcknowledgeAgreements`, `agreements_acknowledged_at`). Missing only true e-signature capture. | **3–5 d** |
| **Payments** | `Payments.jsx` | "Your payments will live here" (breakdown, plan, history, receipts) | None live — Stripe intake is dormant across intake controllers. | **6–10 d** (gated on Stripe) |
| **Messages** | `Messages.jsx` | "Your message threads will live here" (thread per dept, attachments, notify on reply) | Partial — `message_logs` + `CommunicationService` exist for outbound; no inbound/thread model. | **5–8 d** |
| **Settings** | `Settings.jsx` | "Settings will appear here" (notification prefs, language/timezone, export, delete) | None — no per-user preference store; `Setting` model is tenant-global, not per-lead. | **3–5 d** |

(Effort = rough dev-days for one engineer to a shippable first version, excluding deep QA. Agreements is the cheapest high-value win because most plumbing exists.)

---

## Section 9 — Missing capabilities (vs a typical lead portal)

| Capability | Present? | Notes |
|---|---|---|
| Application progress timeline | ✅ | Journey + Submissions + tracker timeline (incl. 12-step immigration journey) |
| Document checklist with progress | ⚠️ | Checklist + per-section status exists, but no overall progress indicator and not per-visa-type configurable |
| Two-way messaging | ❌ | Messages stub; bridge is external email |
| Self-service info update | ⚠️ | Tracker only; not in the logged-in portal |
| Appointment scheduling | ⚠️ | Can **view** bookings; cannot **self-book** from the portal (booking is a separate public funnel) |
| Document re-request / reminders | ❌ | No automated outstanding-doc reminders or expiry alerts |
| Notification preferences | ❌ | Settings stub; no per-lead prefs store |
| Help / FAQ | ❌ | None in the portal |
| E-signatures | ⚠️ | Acknowledgement timestamp only; no captured signature |
| Payments / invoices | ❌ | Stub; Stripe dormant |
| Proposals / decisions | ❌ | Stub |
| Password change / 2FA | ❌ | "Coming soon" on Profile |
| In-app notifications | ✅ | Bell + `portal/lead/Notifications` |

---

## Section 10 — Confidence and gaps

**High confidence (read the code directly):**
- Auth flow, guard, route prefix, invitation lifecycle/expiry (Section 1) — read `AuthController`, `config/auth.php`, `LeadPortalInvitationController`.
- Full route map + which pages are stubs (Section 2) — `route:list` + `routes/web.php:781` + every page file + `ComingSoonPanel` grep.
- Data scoping (Section 3) and document flow (Section 4) — `LeadPortalController`, `LeadDocumentController` (incl. download scoping, upload rules).
- Messaging absence (Section 5), Profile read-only (Section 6), tracker vs portal split (Section 7), stub contents (Section 8) — read each file.

**Inferred / lower confidence:**
- **Effort estimates (Section 8)** are judgement calls, not measured.
- **Email *delivery*** — code dispatches the invitation/status mailables, but actual send depends on the production mail driver (dev is `log`). Not verified against a live SMTP send.
- **`document_checklist` provenance** — confirmed it's a JSON column rendered with a frontend `CHECKLIST` constant + per-lead state; I did not trace every staff code path that writes it.

**Not investigated (out of scope or time):**
- The staff-side review/approve UI in depth (this audit is lead-side).
- The `track/TrackingPage` React component internals (only the controller/data contract was read).
- Queue/worker behaviour for mailables; rate-limiting on the public tracker; pen-test of the tracking-code bearer model beyond reading the scoping checks.
- `Notifications.jsx` lead rendering was confirmed by the controller mapping, not by exercising the page.

---

### One-paragraph summary

The lead portal's **spine is real and well-scoped**: invite-provisioned email/password login on the shared `web` guard, a dashboard/journey/checklist, and a solid **document upload + staff-review** flow with correct per-lead access control. The **client-facing weak spots** are: six `ComingSoonPanel` stubs (VisaForms, Proposals, Agreements, Payments, Messages, Settings), a **read-only Profile** (no self-update in the logged-in portal — only via the separate no-login `/track/{code}` tracker), **no two-way messaging** (the lead↔staff bridge is external email), and **no document reminders/expiry**. The biggest structural issue is the **two overlapping client experiences** (secured portal vs. frictionless tracker) with no single canonical link. Cheapest high-value next steps: finish **Agreements** (most plumbing exists) and add **profile self-update** to the logged-in portal.
