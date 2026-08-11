# Build 12 — Open items carried forward

*Everything still open or deferred across Build 12, in one place, so nothing gets
lost between here and Phase 7 (model-sourced findings, §8b). Grouped by kind.*

Status of the code: phases 1–6 plus Attention and the findings-grouping
refinement are committed locally on `full_blown`. **`full_blown` is unpushed** —
none of it has deployed. Pushing to `staging` / `main` is what deploys.

---

## 1. Failing-tests baseline (pre-existing, unrelated to Build 12)

Ten immigration tests fail, and have failed identically across every Build 12
phase run — they are **not** regressions from this build. They cluster around
visa-checklist seeding and intake resolution (seed data drifted from what the
tests assert, e.g. a PARTNER_WORK count of 21 vs 23, a missing "Identity"
section). Triage before Phase 7 so a real regression can't hide behind them.

- `AssessmentPipelineTest` › 14 convert finds existing lead by email
- `CaseDocumentsTabTest` › renders checklist for known visa type
- `CaseDocumentsTabTest` › shows fallback when visa type unknown
- `CaseDocumentsTabTest` › progress counts required items only
- `CaseProfileDataLoadingTest` › assessment converted case loads intake data
- `CaseProfileDataLoadingTest` › work intake resolves with correct type
- `CaseProfileDataLoadingTest` › checklist loads from visa type
- `CaseProfileDataLoadingTest` › checklist falls back to empty when no visa type match
- `VisaChecklistSeederTest` › seeds five overlapping visa types with correct counts
- `VisaChecklistSeederTest` › labels embed section in canonical section dot name shape

**Action:** decide whether the seed data or the test expectations are the source
of truth, then fix one side. Owner: TBD.

## 2. Step 08 `applies_when` — decision still open (§14.5)

- **Shipped:** the safe default **(a) first 5 cases per adviser, by ordinal**
  (`adviser_case_ordinal_lte: 5`). The predicate is wired and evaluated; it never
  re-fires on an experienced adviser whose caseload dips (the wrong reading,
  `adviser_case_count_lte`, was deliberately **not** shipped).
- **Still open:** the department hasn't confirmed the intent. Alternatives are
  (b) first N cases in a time window after a process change, or (c) a
  manually-toggled QA mode. If the department wants (b) or (c), the predicate
  changes; (a) needs no change.
- **Action:** confirm the reading with the department during/after the staging
  week. Watch item #2 in the test plan feeds this.

## 3. Step 07 — marker, not a gate (§15.4)

- **Shipped:** step 07 (video / booking / signature) is a **process marker**
  (`gate = false`). It records that the point was reached; it does not block on a
  self-attested checkbox, because a checkbox is a record, not evidence.
- **Still open:** it becomes a **real gate** only when video-view telemetry exists
  ("watched → unlock signature"), which is deferred (see §12 / item 4). When that
  lands, flip step 07's gate flag on.
- **Action:** none now; revisit when the video-view build is scheduled.

## 4. Deferred / explicitly out of scope (§12)

Not started, on purpose. Do not build these under Build 12:

- **AI eligibility triage.**
- **AI phone call + the 24-hour assessment email** (keep it out of step 04 too).
- **Agreement explainer video and its view gate** — the prerequisite for turning
  step 07 into a gate (item 3).
- **Client-portal journey redesign.**
- **Two-week operations report** — was blocked on stamp history. Stamp history now
  exists (the step chain), so this is **unblocked but unbuilt**. Candidate for a
  near-term follow-up.

## 5. Next Build 12 phase — model-sourced findings (§8b, "Phase 7")

The remaining phase: AI-observed findings (name/date inconsistencies, coverage
gaps, wrong document in a slot, illegible scans) written into the same findings
list with `source = ai`, `audience = adviser`, phrased as observations, never
judgments.

**Gate before it ships (standing constraints):** the eval harness and the
agent-event audit trail must exist first, and nothing advice-bearing may be
recorded with the AI as approver. Don't start §8b until those are in place.

## 6. Documentation drift to fix

- `docs/ai-agent/01-guardrails.md` **#7** still reads "immigration_adviser is
  read-only by design." Build 12 §2 reversed that with the content-level licence
  gate (`AdviceBearingPolicy`). This was flagged to fix "when Phase 5 lands" —
  Phase 5 has landed, so this is **now due**, before a future reader reinstates the
  old rule. (`immigration-architecture.md` §2 and `CLAUDE.md` were already updated.)

## 7. Deployment-time configuration (not bugs)

- **`config('immigration.step_owners.*')`** (coordinator / qc / ops / adviser) is
  all `null` by default. Until set to real user IDs per deployment, step owners
  resolve to *unassigned* and someone must assign by handoff. For the **adviser**
  role with more than one current licence and no default set, steps resolve to
  unassigned and a warning is logged — set a default adviser to auto-assign.
- **Findings thresholds** in `config/immigration.php` are starting guesses, not
  decisions: `custody_stale_amber_days` / `custody_stale_red_days`,
  `no_contact_days`, `doc_request_unanswered_days`, `passport_expiry_months`,
  `payment_overdue_days`, `thread_unanswered_days`. Tune from real dwell times and
  per-rule dismissal rates after the staging week.
- **`COLLAPSE_MIN`** in the AI Health panel (currently 3) controls when repeated
  same-rule findings collapse into one summary row. Tune if the panel still reads
  as a wall, or if it hides too eagerly.

## 8. Unrelated work sitting in the tree

A **referral-code** change (touching `LeadController`, `AgentController`,
`User.php`, `agent/Dashboard.jsx`, `QuickRegisterPage.jsx`, plus an
`add_referral_code_to_users` migration) is present but **uncommitted** in the
working tree. It is **not** part of Build 12 and was deliberately left untouched.
Flagged here so it isn't accidentally folded into a Build 12 commit or lost.
