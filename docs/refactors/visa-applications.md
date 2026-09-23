# Refactor plan — Visa Applications (multi-application per profile)

> **Status:** proposal / not started.
> **Decisions locked:** full `VisaApplication` entity (not a lightweight counter); applications are
> **always sequential** (at most one active application per profile at a time).
> **Related:** [`../immigration-architecture.md`](../immigration-architecture.md),
> [`leads-table-split.md`](leads-table-split.md).

## 1. Problem

Today **one `Lead` = one visa application.** The whole visa lifecycle lives as flat columns on the
`Lead` row (`immigration_stage`, `immigration_priority`, `immigration_assignee`, `stage_history`,
`inz_visa_type`, `inz_status`, `inz_reference`, `inz_lodged_at`, `inz_decision_at`,
`has_been_declined_visa`, `declined_visa_details`), and every child record (`LeadDocument`,
`Agreement`, invoices, `CaseFinancial`/`CaseFinancePayment`, `CaseFinding`/`CaseFindingRun`,
`CaseStepState`, `CaseThread`) attaches by `lead_id` with **no notion of which application it belongs
to**.

Real clients have **many visa applications over time on the same profile**:

- **Decline → relodge.** The client relodges in the same profile, reusing documents. Today the
  relodge overwrites the declined attempt's stage/dates and mixes its documents/invoices in. All that
  survives is a single `has_been_declined_visa` boolean — we cannot count "declines this year" or
  link the relodge to what was declined.
- **Approved → new visa later.** An approved study visa client applies for a work visa next year in
  the same profile. The new application clobbers the approved one; the "previously approved" history
  is lost.

There is a `'For Relodgement'` stage label but **no data structure behind it**.

> **Overloaded column to fix on the way through:** `leads.has_been_declined_visa` is a **Personal
> Profile disclosure** — the "Visa Previously Declined" field the client declares about their *own
> history* (edited on `LeadDetails`, validated via the profile update path). It is **not** part of the
> visa assessment funnel and is **not** the case's outcome. But `ImmigrationController::declineVisa()`
> also writes `has_been_declined_visa = true`, so our own INZ decline corrupts the disclosure — a
> client who never declared a prior decline suddenly looks like they did. These two concerns must be
> **decoupled**: the prior-declines disclosure stays on the profile untouched; the case's own decline
> moves to `VisaApplication.outcome`, and `declineVisa()` must stop writing the disclosure flag.

## 2. Target model

`Lead` stays the **client profile** (identity, contact, portal access, documents *library*, and
disclosed history). A new **`VisaApplication`** ("matter") holds the **per-application lifecycle** —
one row per visa attempt.

```
Lead (profile)  1 ──── many  VisaApplication (matter, sequential)
  ├─ person / contact / portal                ├─ sequence_no          (1, 2, 3… on this profile)
  ├─ disclosed history (ever declined?)       ├─ application_type     (new | relodge)
  ├─ documents LIBRARY (reusable identity)    ├─ relodge_of_id     →  prior VisaApplication (lineage)
  └─ activity spanning ALL applications       ├─ visa_type_id
                                              ├─ immigration_stage / priority / assignee
                                              ├─ stage_history / stage_updated_at / stage_updated_by
                                              ├─ inz_visa_type / inz_status / inz_reference
                                              │  inz_lodged_at / inz_decision_at
                                              ├─ outcome  (in_progress | approved | declined | withdrawn)
                                              ├─ outcome_at / outcome_detail
                                              ├─ opened_at / closed_at / created_by
                                              └─ agreements / invoices / financials / findings / steps
```

### `visa_applications` table

| Column | Type | Notes |
|---|---|---|
| `id` | bigint PK | |
| `lead_id` | bigint FK → leads | the profile; indexed |
| `sequence_no` | unsigned int | 1-based, per lead |
| `application_type` | enum `new`\|`relodge` | |
| `relodge_of_id` | bigint FK → visa_applications, nullable | set when `application_type = relodge` |
| `visa_type_id` | bigint FK → visa_types, nullable | |
| `immigration_stage` | string | moved off `leads` |
| `immigration_priority` | string | `urgent…done` |
| `immigration_assignee` | string, nullable | |
| `stage_history` | json | per-application timeline |
| `stage_updated_at` / `stage_updated_by` | ts / bigint | |
| `inz_visa_type` / `inz_status` / `inz_reference` | string, nullable | |
| `inz_lodged_at` / `inz_decision_at` | date, nullable | |
| `outcome` | enum, default `in_progress` | `in_progress`\|`approved`\|`declined`\|`withdrawn` |
| `outcome_at` | ts, nullable | **the field reporting counts on** |
| `outcome_detail` | text, nullable | decline reason / approval note (was `declined_visa_details`) |
| `opened_at` / `closed_at` | ts | |
| `created_by` | bigint | |
| timestamps | | |

**"Active application" is derived, not stored** (sequential ⇒ at most one non-terminal row):
`activeApplication = applications where outcome = in_progress` (latest `sequence_no`).
**This means we add nothing to the `leads` god-table** — no row-size risk (see
[`leads-table-split.md`](leads-table-split.md)); the refactor *removes* pressure by moving the
immigration columns off `leads` over time.

### Child records gain a nullable `visa_application_id`

Backfilled to the profile's application #1. Nullable so profile-level rows (reusable identity
documents, notes about the person) can stay unscoped.

- **Per-application:** `Agreement`, invoices (`LeadDocument source_variant=invoice`),
  `CaseFinancial`/`CaseFinancePayment`, `CaseFinding`/`CaseFindingRun`, `CaseStepState`, `CaseThread`,
  application-specific `LeadDocument` (decline letter, INZ receipt, engagement pack).
- **Profile-level (stay unscoped):** reusable identity docs (passport, ID), `LeadNote` about the
  person, portal access.

## 3. How the two scenarios resolve

- **Decline → relodge.** `declineVisa()` sets the active application's `outcome = declined`,
  `outcome_at = now`, `closed_at`, and stops there. A **"Start relodge"** action creates a *new*
  `VisaApplication` (`application_type = relodge`, `relodge_of_id = <declined app>`), clones the
  checklist, and carries forward still-valid documents. Reporting:
  `WHERE outcome='declined' AND outcome_at BETWEEN <year>` = **declines this year**; `relodge_of_id`
  gives relodge chains and relodge-success rate.
- **Approved → new visa later.** Approval closes application #1 (`outcome = approved`). A **"Start new
  application"** action creates application #2 (`application_type = new`, `sequence_no = 2`). The Case
  Profile shows the full history: *Study visa · Approved · 2025 → Work visa · In progress · 2026*, so
  the prior approval is first-class and queryable.
- **Sequential guard.** Starting a new/relodge application is blocked while one is still
  `in_progress` — the current one must reach an outcome first.

## 4. Reporting (the payoff)

Straightforward queries once outcomes live on `visa_applications`:

- Declines this year (overall / per adviser / per visa type)
- Relodge count and relodge → approval rate (`relodge_of_id`)
- Repeat clients (profiles with `count(visa_applications) > 1`) and their approval history
- Cases board = each profile's **active** application; profiles with no active application drop off

## 5. Migration & backfill

1. Create `visa_applications`; add nullable `visa_application_id` to the child tables above.
2. For every `Lead` that is an immigration case (`is_immigration_case = true` **or**
   `education_stage IN EDUCATION_STAGES_IMMIGRATION`), create application **#1** copying the current
   immigration columns. Map outcome from stage: `Approved Visa → approved`, `Decline Visa → declined`,
   `Withdrawn → withdrawn`, else `in_progress`; set `outcome_at` from `stage_updated_at`/
   `inz_decision_at` when terminal.
3. Backfill each child record's `visa_application_id` to that lead's application #1.
4. MySQL-guard any `leads`-touching step per the CLAUDE.md row-size rule (this plan touches `leads`
   only to *read* during backfill and, later, to drop the moved columns — no VARCHAR adds).

## 6. Phasing (keep blast radius contained)

The case-hood assumption "`lead_id` **is** the case" runs through `ImmigrationController`,
`CaseProfileController`, `AgreementController`, findings rules, `/track/{code}`, the lead portal, and
reports — so phase it:

1. **Data layer.** Create table + backfill + `Lead::activeApplication()` + read-through accessors so
   existing screens (`$lead->immigration_stage` etc.) proxy to the active application. Nothing visible
   changes yet. Keep the `leads` columns as a mirror during the transition.
2. **Writes.** Point stage moves, `recordOutcome()`/`declineVisa()`, agreements, invoices, findings,
   and step state at the active application. Stop writing the mirrored `leads` columns.
3. **UX.** Case Profile: application history/switcher + "Start relodge" / "Start new application"
   actions (with the sequential guard) + document carry-forward. Header shows the active application
   and prior outcomes.
4. **Reporting & cleanup.** Reports/dashboard read from `visa_applications`; drop the mirrored,
   now-unused immigration columns from `leads` (MySQL-guarded), reclaiming god-table row budget.

## 7. Open questions

- **Financials across relodge:** does a relodge get a fresh engagement/invoice, or can fees roll over
  from the declined attempt? (Affects whether `CaseFinancial` copies forward.)
- **Client-facing history:** on `/track/{code}` and the lead portal, does the client see prior
  applications, or only the active one?
- **INZ government fee on relodge:** re-charged each lodgement (assume yes — it's a per-lodgement
  government charge).
