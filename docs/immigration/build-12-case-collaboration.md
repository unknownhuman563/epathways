# Build 12 — Case collaboration & assist

> Implementation brief for the Immigration portal. Read
> [`docs/immigration/README.md`](README.md) first for the domain picture, and
> [`ai-agent/01-guardrails.md`](../ai-agent/01-guardrails.md) for the binding constraints.
> This document supersedes the read-only adviser rule in §2 and §9 of the architecture doc —
> see §2 below.

> **Provenance note.** This file was reconstructed into the repo during Build 12 phase 3/4.5 work;
> the canonical architecture doc that shipped with phases 1–3 is
> [`docs/immigration-architecture.md`](../immigration-architecture.md). Keep the two in step.

---

## 1. Problem

Immigration staff cannot see, from inside the system:

- who currently holds a case,
- whether the adviser has looked at it,
- what the adviser concluded, and why,
- what is outstanding on the case and who is chasing it.

All four are currently inferred from `immigration_stage`, which can only carry one of them.
The gap is filled by WhatsApp and verbal handovers, so the case record is not the source of
truth and the weekly report has to be assembled by hand.

**Goal:** make custody, attention, verdict and outstanding work first-class, visible fields on
the case. Everything else in this brief supports that.

---

## 2. Permission model change (do this first)

The current rule — `immigration_adviser` is read-only — is being reversed. It was a
misapplication of the IAA 2007: the Act restricts *who may give immigration advice*, and the
licensed adviser is the only person who lawfully may. Making the adviser read-only means
advice-bearing content gets authored by unlicensed staff and merely nodded at verbally.

Replace the role-level restriction with a content-level one.

### Advice-bearing artifacts — author or approver must hold a current licence

- Eligibility endorsement and its reasoning
- Case verdict (`good_to_go` / `needs_something` / `cannot_endorse`)
- RFI responses to INZ
- Lodgement sign-off
- Written advice issued under the engagement
- Any client-facing statement about whether the applicant qualifies

### Ordinary — normal role permissions apply

Contact details, appointments, document upload and checklist stamping, invoice generation,
payment recording, internal notes and threads, handoffs, stage moves that do not imply a
judgment.

### Work

1. Add `licence_number` (nullable string) and `licence_expires_at` (nullable date) to `users`.
   Add `User::holdsCurrentLicence(): bool`. *(Shipped, reusing the existing `iaa_licence_*`
   columns rather than new ones — see `docs/immigration-architecture.md` §2.)*
2. New `App\Policies\AdviceBearingPolicy` with an `approve` ability that calls
   `holdsCurrentLicence()`. *(Shipped.)*
3. Remove `immigration_adviser` from any read-only path. Advisers get full write on the case.
   *(Shipped.)*
4. AI-sourced content may populate a **draft** of any advice-bearing artifact but must never be
   recorded as its approver. Enforce in the policy, not in the controller. *(Shipped.)*
5. Update the architecture doc + CLAUDE.md. *(Shipped.)*

---

## 3. Schema

```
leads
  + current_owner_id  (fk users, nullable, indexed)   [phase 2, shipped]
  + owner_since       (timestamp, nullable)           [phase 2, shipped]

case_views                          passive telemetry, no user action   [phase 4]
  lead_id, user_id, opened_at, duration_s
  index (lead_id, user_id, opened_at)

case_attestations                   append-only · EVERY row licence-gated   [phase 5]
  lead_id, adviser_id, type enum(verdict|lodgement_signoff),
  verdict enum(good_to_go|needs_something|cannot_endorse) nullable,   # type=verdict only
  reason text nullable, supersedes_id nullable, created_at
  reason NOT NULL for a verdict that isn't good_to_go (validate in FormRequest)
  # Replaces the separate case_verdicts + case_signoffs — see §15.2. QC is NOT here.

case_threads                        anchored, resolvable                [phase 6]
  lead_id, anchor_type enum(case|document|gate|stage), anchor_id nullable,
  author_id, addressed_to_id nullable, body, requires_answer bool,
  resolved_at nullable, resolved_by nullable, created_at

case_findings                       one shared list per case            [phase 3, shipped]
  lead_id, finding_key, category, severity enum(blocking|check|info),
  title, detail, evidence json,
  source enum(rule|ai), audience enum(staff|adviser|both),
  status enum(open|actioned|dismissed), actioned_by/at nullable,
  dismiss_reason nullable, dismissed_fingerprint nullable, first_seen_at, last_seen_at
  unique (lead_id, finding_key)
```

`finding_key` is stable per rule so a recurring finding updates `last_seen_at` rather than
duplicating. Never delete findings — resolve by setting `status`.

`case_attestations` and `case_findings` are never updated destructively. A changed verdict is a
new row with `supersedes_id` set.

The process-chain tables — `case_step_templates`, `case_step_states` (one row per step *attempt*,
§15.7), `case_payments` (§15.5), `case_partner_recommendation` (§15.6) — are specified in §15.

---

## 4. Custody   *(phase 2, shipped)*

One owner at a time. Ownership changes only through an explicit handoff that carries a note.

- `POST /portal/immigration/cases/{lead}/handoff` — `{ to_user_id, note }`. Handing to yourself
  is a claim. Notifies the new owner in-app + email, carries the note, links to the case.
- Cases index gains a **My queue** and **Unassigned** filter.
- Ageing is derived from **`last_activity_at`** (stuck), not `owner_since` (long). Constants in
  `config/immigration.php`.

---

## 5. Attention (passive — no self-reporting)   *(phase 4)*

Derive it; advisers won't maintain a manual status.

- Write a `case_views` row on case/document open. Throttle to one row per user per case per 15 min.
- Board chip: *Not opened* / *Open Nh ago* / *Reviewed {date}*, from the latest licensed-user view.
- Case Profile header shows total review time and what changed since that user last opened it.

No manual "mark as reviewed" control.

---

## 6. Verdict   *(phase 5)*

One control on the Case Profile, adviser-only via `AdviceBearingPolicy`:

| Verdict | Behaviour |
|---|---|
| `good_to_go` | Case advances; custody moves to the next role automatically |
| `needs_something` | Reason required; custody returns to the previous owner |
| `cannot_endorse` | Reason required; raises a blocking finding and holds the case |

The stage transition is **derived from the verdict existing**, not performed by the adviser.

`POST /portal/immigration/cases/{lead}/verdict` — append-only.

> **Amended by §15 (Q2/Q5):** the verdict and the lodgement sign-off are both advice-bearing and
> share one policy, so they share one table — `case_attestations`, `type ∈
> {verdict, lodgement_signoff}`, **every row licence-gated, no exceptions**, no `step_key`.
> Procedural QC stamps are *not* here — they live in the non-gated `case_step_states` (§15.2).

---

## 7. Threads   *(phase 6)*

Anchored questions that stay visible until answered. Every message anchors to the case, a
document, a gate or a stage. Not a general messaging surface.

---

## 8. Case assist (`case_findings`)   *(8a/8c shipped in phase 3; 8b later)*

### 8a. Rules engine  *(shipped)*

`App\Services\Immigration\CaseFindingService::evaluate(Lead $lead)`. One small class per rule.
Rules shipped: checklist-item-missing, document-rejected, passport-expiring,
document-request-unanswered, no-client-contact, engagement-without-invoice. The invoice-overdue
and unresolved-thread rules report into "couldn't verify" until their data exists (§15 Q5, phase 6).

### 8b. Model-sourced findings   *(later phase)*

Name/date inconsistencies, coverage gaps, wrong-document-in-slot, illegible scans. Write into the
same table with `source = ai`, `audience = adviser`, phrased as observations, never judgments.

### 8c. Panel behaviour  *(shipped)*

AI Health tab. One shared list filtered by audience. One-click action per finding. Required
"couldn't verify" line. Dismissal requires a reason and persists — scoped to the finding's
evidence fingerprint, so a changed situation re-opens it.

### 8d. When it runs  *(shipped)*

Queued on document upload, stage change, and nightly. Never on page load; the panel renders the
last stored result with its timestamp.

---

## 9. Blocking behaviour

A `blocking` finding warns loudly and requires an override to proceed past the relevant gate. The
override is permitted, requires a reason, and is recorded against the user. Not a hard block.

---

## 10. Frontend

Pages under `pages/portal/immigration/`, auto-wrapped in `ImmigrationLayout`. Custom row payloads
must explicitly include new fields — they do not arrive through `BuildsLeadRow`. Tailwind v4 —
literal class strings only.

---

## 11. Phases

Ship one phase per PR. Each is independently useful. **Build order (updated):**

1. **Permission flip** (§2) — *shipped.*
2. **Custody** (§4) — *shipped.*
3. **Findings, rules only** (§8a, §8c) — *shipped.*
4. **Process chain** (§15) — **NEW, this spec.** Sits here: after findings (it extends the rules
   engine with SLA/gate findings) and **before Verdict** (it settles the advice-vs-QC table
   boundary that Verdict depends on). Labelled *Phase 4.5* per the request; the number is a label,
   not strict order.
5. **Verdict** (§6, amended by §15) — was Phase 5. Moved ahead of Attention: the verdict is what
   *unblocks work*, and it exercises the licence gate (phase 1) and custody (phase 2). Re-spec
   required — see §15 Q2/Q7.
6. **Threads** (§7).
7. **Attention** (§5) — moved after Verdict: mostly informational, and the phase where advisers
   may feel watched, which lands better once the build has already earned trust.
8. **Model-sourced findings** (§8b).

> Original order was 1 permission → 2 custody → 3 findings → 4 attention → 5 verdict → 6 threads →
> 7 model findings. The 4↔5 swap and the Process-chain insertion are deliberate (§15 Q7).

---

## 12. Explicitly out of scope for this build

Deliberately deferred. Do not start them here:

- AI eligibility triage
- AI phone call and the 24-hour assessment email
- **Agreement explainer video and its view gate** — *see §15.4: the process chain models step 07
  as a process **marker** (a record that the point was reached), NOT a gate. It becomes a gate only
  when view telemetry exists; a self-attested checkbox is a record, not evidence.*
- Client-portal journey redesign
- Two-week operations report (needs stamp history first — build after phase 5)

---

## 13. Working notes

- **Commits on `full_blown` deploy.** Work on a feature branch per phase; do not commit directly.
- `.env` holds live secrets — never recreate or echo it.
- All new writes go through the existing `LogsActivity` trait so they land in `/admin/activity-logs`.
- Row-level scoping is the controller's job. `EnsurePortalAccess` is role-level only — re-check
  `is_immigration_case` and ownership before acting.
- No generated numbers anywhere in this build. Fees come from `VisaType::professionalFeeFor()` and
  `feeBreakdown()`; anything a rule cannot source from a tool call is reported as unknown.

---

## 14. Open decisions

Flag these rather than guessing:

1. Where quality control sits — QC of the outbound engagement pack and pre-lodgement QC are two
   different gates. *(§15 Q2 resolves the data model; the operational placement is steps 03/08/10
   + the lodgement sign-off at 12.)*
2. Whether the follow-up cadence starts from case creation or from stage entry. *(§15 Q3 recommends
   from step activation.)*
3. Ageing thresholds. *(Shipped in `config/immigration.php`; still a starting guess.)*
4. Whether `immigration_manager` should also record a verdict when no licensed adviser is
   available. Default no — confirm with the LIA of record.

---

## 15. Phase 4.5 — Process chain (spec)

> Status: **spec only, no implementation.** This section resolves the design questions before any
> code is written, and constrains Phase 5 (Verdict).

### 15.0 What this phase adds

The department runs a defined **16-step process** with named owners, deadlines and gates. Build 12
has no representation of it — the 16 steps live in people's heads and a spreadsheet. This phase
makes the process a first-class, per-case structure that the existing board, findings engine and
(soon) verdict hang off.

The 16 steps (owner · SLA · flags):

| # | Step | Owner | SLA / flag |
|---|---|---|---|
| 01 | Endorsement from EP Education | Ange · Emma | 3 channels |
| 02 | Visa information form completed | Emma | 48 hrs |
| 03 | Portal check, all fields filled | Rhandel | QC |
| 04 | Confirmation call, scripted | Emma | — |
| 05 | Acknowledgement email | Emma | 3 channels |
| — | *fork (partner visas): recommend main applicant; client chooses in writing* | Adviser | advice |
| 06 | Engagement agreement issued | Dev · Henry | 24 hrs · **gate** |
| 07 | Video, booking and signature | Emma · Ange | **gate** · must watch to sign |
| 08 | QC audit of the trail | Rhandel | QC · first 5 cases |
| 09 | Checklist and documents sent | Emma · Rhandel | — |
| 10 | Two-line document check | Emma → Rhandel | QC |
| 11 | Payment received | Emma · Rhandel | in parallel |
| 12 | Upload to INZ portal | Dev · Henry | 48 hrs · **gate** |
| 13 | Lodged | — | milestone |
| 14 | Friday status updates | Emma | weekly |
| 15 | Halfway chase with Immigration | Dev · Henry | at 50% |
| 16 | Decision | — | milestone |

Steps 01–05 each run across three channels (message · call · email). Henry Dai is the LIA;
"Dev · Henry" means Dev operates the mechanics and Henry carries the advice-bearing sign-off.

### 15.1 (Q1) Stages vs steps — **nest, don't replace**

**Recommendation: the 16 steps are a new operational layer that nests inside the existing 11
`IMMIGRATION_STAGES`. Stages are unchanged.**

**Reasoning.**

- *Replacing stages is a high-blast-radius rewrite.* `IMMIGRATION_STAGES` is load-bearing across
  the Cases board tabs and distribution graph, `stage_history`, `stampLastActivity` descriptions,
  the education Students segmentation, the custody staleness signal, and the no-contact finding.
  Replacing it means a data migration mapping every live case to a step **and** touching all of
  those surfaces. Nesting adds two tables and touches none of them.
- *The client must keep seeing a simple journey.* The public `/track` view shows a handful of
  milestones. Sixteen steps — several of them internal QC and 3-channel bookkeeping — would
  overwhelm a client and expose internal process. Steps stay **staff-internal**; the client-facing
  view continues to render the coarse stage (or an even smaller milestone set).
- *One source of truth for "where is this case".* Each step template row carries a `stage` mapping.
  When a step completes, the case's `immigration_stage` is **derived** from the step's mapped stage
  (denormalised so the existing stage-based UI keeps working unchanged). Staff read steps; the
  board reads stages; they can't disagree.

**Migration cost.**

- *Nest (recommended):* two new tables (`case_step_templates` seed + `case_step_states`), a
  step→stage mapping, and a small "Process" panel on the Case Profile. No change to
  `IMMIGRATION_STAGES`, no backfill required (existing cases start with an empty step chain and
  populate lazily or via a one-off seeder). Low.
- *Replace:* new enum/table of 16 steps, rewrite of every stage consumer listed above, a data
  migration for all live cases, and a redesign of the client journey to re-hide detail. High, and
  it regresses the client view. Rejected.

**Step→stage mapping** is TBD against the actual `Lead::IMMIGRATION_STAGES` values and belongs in
the template seed; the template must carry a `stage` column so the mapping is data, not code.

**Two writers to `immigration_stage` — the chain wins.** Staff currently move stage inline via
`POST /cases/{id}/stage`; §15.1 also derives stage from the completed step. If both write the
column directly they will disagree. **Decision: once the chain lands, the step chain is the single
authoritative writer of `immigration_stage`. The inline stage control is re-pointed to advance/jump
the step chain (a manual stage change becomes "jump to the step mapped to that stage", audited),
and direct writes to the column outside the chain are removed.** So there is exactly one writer;
the manual UI becomes a front-end onto the chain, not a second author. Rollout is not a hard
cutover: a case with no step chain yet falls back to today's manual behaviour, so existing cases
keep working until they are brought onto the chain. State this explicitly wherever `updateCaseStage`
is touched.

### 15.2 (Q2) Verdict scope — **do NOT add `step_key`; one gated table, QC separate**

**Recommendation: one `case_attestations` table holds every advice-bearing sign-off — `type ∈
{verdict, lodgement_signoff}` — and *every* row is licence-gated with no exceptions. Procedural
step completions and QC stamps live in the separate, non-gated `case_step_states`. No `step_key` on
attestations.**

**Reasoning — the licence gate is strongest at the table boundary.** The phase-1 guarantee is:
*every row in an advice-bearing table requires a current licence, no exceptions.* Mixing
advice-bearing rows with non-advice QC rows in one table makes the gate conditional *within* the
table — a `step_key`-driven `if` — and that is the shape that rots: a refactor relaxes the check to
let Rhandel's QC through and an advice row slips past unguarded. So the split that matters is
**gated vs non-gated**, drawn at the table boundary.

That boundary argument, however, does **not** justify splitting the two *gated* artifacts from each
other. The case verdict and the lodgement sign-off are both advice-bearing and both gated by the
same `AdviceBearingPolicy`. Putting them in two tables (`case_verdicts` + `case_signoffs`) is one
more table and one more policy registration to drift out of step, for no compliance gain. **Collapse
them into one `case_attestations` table**, discriminated by `type`, gated uniformly.

The three QC points (03, 08, 10) are **procedural**, not advice — "are the fields filled / is the
trail complete / do two lines match". Rhandel is **not licensed** and must not be routed through
`AdviceBearingPolicy` (it would wrongly block his legitimate QC).

**Resulting model.**

- `case_attestations` — advice-bearing, **every row licence-gated**, `type ∈ {verdict,
  lodgement_signoff}`, append-only, `supersedes_id` for a changed verdict. **No `step_key`.** One
  policy registration; one place the gate lives.
- **Step / QC events** — `case_step_states` (§15.7) records completion + `qc_result`
  (`pass`|`fail`|null) + `completed_by`. **Not** gated by `AdviceBearingPolicy`. A QC fail can raise
  a `check` finding; it never asserts eligibility.
- The step's "done" for advice-bearing steps (06 issue-agreement, 12 lodge) is **derived from the
  attestation existing** — the same "stage-move derived from verdict" pattern (§6). The adviser's
  act is the write; the step flipping to done is the consequence.

### 15.3 (Q3) SLA tracking — computed at activation, stored absolute, surfaced as findings

Five steps carry deadlines: 02 (48 hrs), 06 (24 hrs), 12 (48 hrs), 15 (at 50%), 14 (weekly).

**Compute + store.**

- The step template carries an `sla` descriptor: `{type: duration|milestone|recurring, ...}`.
- When a step **becomes active** (its predecessor completes), store an absolute `due_at` on the
  `case_step_states` row: `due_at = activated_at + duration`. Absolute, not derived-on-read, so it
  is stable and directly queryable by the nightly sweep.
- The three duration SLAs (02/06/12) are straightforward.
- **15 "at 50%" is milestone-relative:** `due_at = lodged_at + (expected_processing_days / 2)`,
  computed when step 13 (Lodged) completes. Needs `expected_processing_days` (already on
  `VisaType`).
- **14 "Friday weekly" is recurring, not a one-shot `due_at`:** model as a cadence. The rule (below)
  fires if, while the case is post-lodgement and pre-decision, no "Friday update" step event was
  logged in the trailing 7 days. Store the cadence on the template, not a `due_at`.

**Surface overdue as `case_findings` — no model calls.** Add one rule class,
`OverdueStepRule`, to the existing engine (§8a). It reads `case_step_states`, finds active,
not-done steps whose `due_at` is in the past (and evaluates the two special cadences), and emits a
finding per overdue step: named ("Step 06 · Engagement agreement — 24 hr SLA overdue by 2 days"),
`evidence: {step_key, due_at, owner}`, `severity: check` (or `blocking` for gate steps, §15.4),
`audience: staff`. It inherits everything the engine already gives: dedup on `finding_key`
(`overdue_step:06:{attempt}`, §15.7), auto-resolve when the step completes, evidence-scoped
dismissal, and the nightly re-evaluation — so overdue steps appear without any page-load work.

**Clock and timezone — pin this, it's where the UTC/NZ bug bites.** `due_at` arithmetic is the one
place the codebase's known UTC/NZ mismatch will surface, so it must be decided, not defaulted:

- Durations are **business time**, not wall-clock. "48 hrs" = **2 business days**, "24 hrs" =
  **1 business day**, counted Mon–Fri (holidays configurable). This is what stops Friday-5pm + 48h
  landing Sunday 5pm and reading overdue on Monday morning.
- The canonical calendar timezone is **`Pacific/Auckland`** — the operating entity and INZ
  deadlines are NZ. The team spanning NZ and the Philippines is a **display** concern, not a
  computation one.
- `due_at` is stored as an **absolute UTC timestamp** computed from the NZ business calendar, and
  **rendered in the viewer's timezone**. All SLA arithmetic goes through **one helper**
  (`ImmigrationBusinessClock` or equivalent) so the UTC↔NZ conversion lives in exactly one tested
  place — tested explicitly across a DST boundary and the PH/NZ offset. `AppServiceProvider` /
  `routes/console.php` already schedule in `Pacific/Auckland`; SLA math must reuse that precedent,
  never re-derive timezone logic ad hoc.
- The recurring cadence (step 14, "Friday") is **NZ Friday**.

### 15.4 (Q4) Gates — reuse the blocking-finding + override pattern; **step 07 conflict flagged**

**Recommendation.** A gate step is one whose non-completion produces a **`blocking` finding**, and
whose successors cannot be started until it is done **or overridden** — exactly the mechanism
§9 already defines (override permitted, reason required, recorded against the user). Gates **06 and
12** set `gate: true` on the template, which makes `OverdueStepRule`/an incomplete-gate rule emit
`blocking` rather than `check`, and makes the step advancer refuse to open the next step without an
override. No new blocking machinery.

**Conflict — step 07 vs §12, and why 07 is *not* a gate yet.** §12 defers "Agreement explainer
video and its view gate", but step 07 *is* "Video, booking and signature — must watch to sign".
These collide, and the resolution is not to dress the deferred gate up in a checkbox.

**A staff checkbox attesting the client watched the video is a *record, not evidence*.** It records
that a staffer ticked a box, not that the client watched — so it cannot carry the compliance weight
of a gate. **Recommendation: model step 07 as a *process marker*, not a gate, while view telemetry
is absent.** It appears in the chain and marks that the process reached the video/signature point,
but it does **not** set `gate: true` and does **not** block progression on a self-attestation —
that would manufacture false assurance. Step 07 **becomes** a real gate only when the deferred
video-view telemetry exists (the automated "watched → unlock signature" build, still out of scope
per §12); at that point flip its `gate` flag on. So: the *marker* is in scope now; the *gate* is
not. §12 is updated to say exactly this.

### 15.5 (Q5) Step 11 payment — minimum state for a real gate

Payment tracking does not exist; it already forced the invoice-overdue rule into "couldn't verify"
in phase 3. For step 11 to be a **real** gate we need the minimum that lets the system answer "is
this paid?" from data, not from someone's memory.

**Minimum model — `case_payments`:**

```
case_payments
  lead_id, invoice_document_id (nullable),
  amount_expected decimal, amount_received decimal default 0,
  status enum(unpaid|part_paid|paid),         # derived: received >= expected → paid
  method nullable, received_at nullable,
  recorded_by (fk users), created_at, updated_at
```

- `amount_expected` seeds from the invoice (a tool-call value, never generated — guardrail #4).
- Receipts are **recorded by a human** (amount + date + method + who) — manual recording, not a
  payment-gateway integration. That is the minimum for a gate; a gateway is a later capability.
- Step 11 gate = `status == paid`.
- **Bonus:** this is exactly the data the phase-3 `InvoiceOverdueRule` reported it *couldn't*
  verify. Landing `case_payments` here lets that rule graduate from "couldn't verify" to a real
  overdue check (invoice generated, `status != paid`, past due). Note the dependency in phase 3's
  rule when this ships.

### 15.6 (Q6) Three channels and the partner-visa fork — minimum data models

**Three channels (steps 01–05).** Each of these steps completes across message · call · email.
Minimum: a `channels` JSON on the step's `case_step_states` row —

```
channels: { message: {done_at, by} | null, call: {…} | null, email: {…} | null }
```

The step is "done" when the required channels are complete (policy per step; default all three).
No separate table needed at minimum scope; promote to `case_step_channels` only if per-channel
history/audit is later required.

**Partner-visa fork (before step 06).** "Recommend the main applicant first, and the client
chooses in writing." Two distinct records:

```
case_partner_recommendation
  lead_id,
  recommended_main_applicant   (adviser-authored — ADVICE, licence-gated, see §15.7),
  recommendation_reason,
  client_choice                (who the client chose),
  choice_document_id           (the written confirmation — the evidence),
  decided_at, recorded_by
```

The **recommendation is advice** (recommending who should be the main applicant is an
immigration-advice call) → authored by the adviser, licence-gated, never by an unlicensed staffer
or an AI surface. The **client's written choice** is a consent-like record (a document reference +
timestamp). The fork blocks step 06 until `choice_document_id` is present.

### 15.7 (Q9) Re-entry and loops — attempts, not a linear chain

The 16 steps are linear; real cases loop, and nothing in the chain expresses going backwards:

- an **INZ Request for Information** at step 12/13 — `Request for Information` is already an
  `IMMIGRATION_STAGES` value and is common — sends the case back to gather and answer;
- a **rejected document** sends step 09 back around;
- a **`needs_something` verdict** (Phase 5) *by definition* returns the case to an earlier point.

A linear advancer can express none of these, and a case that isn't a clean run drifts out of step
with the chain — at which point staff stop trusting it. So the per-case instance is **not** a
linear chain; it is a sequence of **attempts**.

**Mechanism: re-activation with a per-step attempt counter.** A completed step can be re-activated,
opening a **new attempt** of that step (and, where the template declares a dependency, of the
downstream steps that depended on it). Re-activation is neither a branch (the steps are the same,
repeated) nor a silent loop-back (prior attempts are retained for the trail). Each re-activation
records its trigger and reason.

**`case_step_states` is one row per (step, *attempt*), append-only — not one row per step.**
```
case_step_states
  lead_id, step_key, attempt smallint,            # (lead_id, step_key, attempt) unique
  status enum(pending|active|done|blocked|not_applicable),
  owner_user_id (fk users, nullable),             # resolved from template owner_role (§15.8)
  activated_at, due_at nullable,                  # SLA due for THIS attempt (§15.3)
  completed_by, completed_at,
  qc_result enum(pass|fail) nullable,             # QC steps only; NOT advice (§15.2)
  channels json nullable,                         # 3-channel steps (§15.6)
  reactivation_trigger enum(rfi|doc_rejected|verdict_needs_something|manual) nullable,
  reactivation_reason nullable, reactivated_from_attempt nullable,
  created_at, updated_at
```
Current state of a step = its highest-`attempt` row; history = all attempts. Each attempt carries
its own `due_at`, so an RFI re-attempt gets a **fresh SLA** rather than inheriting a stale one.

**Triggers.**

- *RFI:* re-activates the document/answer steps needed to satisfy it as a new attempt; the case's
  stage shows `Request for Information` (the existing stage), and the step→stage mapping (§15.1)
  keeps board and chain aligned.
- *Rejected document:* re-activates step 09 as a new attempt — the same event the phase-3
  `DocumentRejectedRule` already surfaces as a finding.
- *`needs_something` verdict:* re-activates the step the verdict points back to; §6 already returns
  custody to the previous owner.

**OverdueStepRule dedup survives the loop.** The finding key carries the attempt —
`overdue_step:09:2`. Attempt 1's `overdue_step:09:1` auto-resolved when attempt 1 completed, so the
second pass doesn't collide. This falls straight out of the engine's existing dedup + auto-resolve;
no special handling.

### 15.8 (Q10) Owners are roles; custody is a person

Templates must name **functions, not people** — hard-code "Emma" and one leave day makes every
template wrong.

- The **template** carries an `owner_role` — a *process function* (`coordinator`, `qc`, `ops`,
  `adviser`), not necessarily a system role. (Emma = coordinator, Rhandel = qc, Dev = ops,
  Henry = adviser/LIA.)
- A per-department **role→person resolver** turns the function into a user at step activation, with
  a per-case override. When Emma is on leave, reassigning the `coordinator` function re-points every
  case's coordinator steps — no template edit. `case_step_states.owner_user_id` is the resolved
  person for that attempt.

**Reconciliation with `current_owner_id` (Phase 2) — different fields, coordinated.**

- `current_owner_id` (custody) = who holds the case *right now* — one person, moved by explicit
  handoff.
- step `owner_user_id` = who is responsible for *that step*.

They coordinate: when the active step advances to one owned by a different function, **custody moves
to that step's owner** — which is exactly §6's "custody moves to the next role automatically". So
custody *defaults* to the current active step's owner and remains overridable by an explicit
handoff. Custody stays authoritative for "who holds it"; step owners drive where it should go next.
Step ownership is **not** the same field as `current_owner_id`, and the case owner **does** move as
steps advance (by default, via the step owner).

### 15.9 (Q11) Template expressiveness — parallelism and applicability

The linear diagram hides two things the template model must carry:

**Parallelism (step 11).** Payment runs *alongside* 09/10, not after them — a linear advancer can't
represent that. Model step order as a **dependency DAG, not a line**: each template step declares
`depends_on: [step_keys]`. Step 11 (payment) `depends_on` the same predecessor as 09 (so it starts
in parallel), and 12 `depends_on` 11 (so lodgement still can't happen unpaid) — but 09 and 10 do
**not** depend on 11. The advancer activates every step whose dependencies are met, so "parallel"
is simply "no dependency between them", and gates (§15.4) are steps that others `depend_on`.

**Applicability (step 08, and the partner fork).** Step 08 "QC audit of the trail — first 5 cases"
must not fire on every case forever. Add an `applies_when` predicate to the template:
```
step 08:            applies_when: { type: adviser_case_count_lte, n: 5 }
partner fork/06a:   applies_when: { type: visa_is_partner }
```
A step whose predicate is false is instantiated as `not_applicable` — it doesn't block, doesn't
show as pending, and generates no findings. Applicability is a general concept (visa type, adviser
tenure/case count, case attributes) and also models the **partner-visa fork** (§15.6) cleanly:
those steps apply only when the visa is a partner category.

### 15.10 (Q7) Ordering, and re-specs required

**Where Phase 4.5 sits: after Phase 3 (Findings), before Phase 5 (Verdict).** Reasoning:

- It **constrains Phase 5.** §15.2 decides the verdict and the lodgement sign-off share **one
  licence-gated `case_attestations` table** (`type ∈ {verdict, lodgement_signoff}`, no `step_key`),
  with QC in the non-gated `case_step_states`. If Verdict is built first it may bake the wrong table
  shape (a `case_verdicts` that later has to absorb the lodgement sign-off). At minimum §15.2 must
  be settled before Phase 5 code; cleanest is to land the one-table attestation foundation as
  Phase 4.5 → Phase 5 in sequence.
- It **extends Phase 3**, which is already shipped — the SLA/gate rules are new rule classes in the
  existing engine, so it's a natural continuation with no new infrastructure.
- It **feeds Phase 5's gate**: `cannot_endorse` and the lodgement gate both reference the step
  chain and payment state this phase introduces.

**Re-specs required:**

- **Phase 5 (Verdict)** — re-spec per §15.2: build **one `case_attestations` table** (verdict +
  lodgement sign-off, `type`-discriminated, every row licence-gated, no `step_key`) rather than a
  verdict-only `case_verdicts`. QC stays in the non-gated `case_step_states`. Also fold in the
  **lodgement-gate re-surface of dismissed findings** flagged in the phase-3 refinement: reopen
  findings dismissed as a convenience when the case reaches the lodgement gate, so a stale dismissal
  can't ride through to submission (this is the fix for the static-evidence dismissal limitation
  noted in phase 3, §15.7's re-entry does not cover it).
- **Phase 3 (Findings)** — no re-spec, but note the dependency: `OverdueStepRule` is added when
  Phase 4.5 lands, and `InvoiceOverdueRule` graduates from "couldn't verify" once `case_payments`
  exists (§15.5).
- **Phase 4 (Attention)** — unaffected; stays informational telemetry. Remains after Verdict per
  the §11 re-order.
- **Phase 6 (Threads)** — unaffected. The QC hand-off at step 10 (Emma → Rhandel) is a natural
  thread anchor later, but is not a dependency.

### 15.11 (Q8) Guardrail conflicts in the 16 steps

Scanned against [`ai-agent/01-guardrails.md`](../ai-agent/01-guardrails.md). As **human-operated**
steps none of the 16 breach a guardrail, but the following must be enforced in the design, and two
are latent risks if any step is later automated:

1. **Partner-visa recommendation is advice (guardrail #1).** Recommending the main applicant is an
   immigration-advice call. It must be **adviser-authored and licence-gated** — never an unlicensed
   staffer, never an AI surface drafting it as fact. Encoded in §15.6.
2. **Step 01 endorsement must be a referral, not an education visa opinion (guardrail #3).**
   Education staff hand the case *over*; they must not opine on visa prospects. If "endorsement"
   ever encodes an education judgment about visa suitability, it crosses the education/immigration
   line. Keep it a routing handoff.
3. **QC (03, 08, 10) must stay procedural (guardrail #1).** Rhandel/Emma check that the process
   happened (fields filled, trail complete, two lines match) — never "is this applicant eligible".
   The moment a QC step encodes an eligibility judgment it becomes advice and must move behind the
   licence gate. This is *why* QC stamps are kept out of `case_attestations` (§15.2).
4. **Step 12 splits mechanics from advice (guardrails #1, #2).** "Dev · Henry": Dev may operate the
   INZ upload, but the **lodgement sign-off is the adviser's** advice-bearing act, licence-gated
   and logged. Do not let the mechanical upload stand in for the sign-off.
5. **Latent — if step 04 (scripted call) or step 14 (status updates) are ever automated**
   (guardrails #1, #14): a client-facing agent runs status/process only, must disclose it is AI,
   and must escalate anything advisory. The brief already defers the "AI phone call" (§12); flagged
   so it isn't quietly reintroduced through step 04.
6. **Doc-consistency (not a step conflict).** Guardrail **#7** still reads "immigration_adviser is
   read-only by design" — Build 12 §2 reversed that with the content-level licence gate.
   `01-guardrails.md` #7 needs updating to the `AdviceBearingPolicy` model (as
   `immigration-architecture.md` §2 and CLAUDE.md already were), or a future reader will reinstate
   the old rule. Recommend updating #7 when Phase 5 lands.

---
