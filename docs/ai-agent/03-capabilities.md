# Capability Specification

105 capabilities across every portal and sidebar module.

Each entry states what the agent does, what fires it, how much autonomy it has, and what it needs to
exist. **Autonomy levels and compliance flags are binding** — see
[`01-guardrails.md`](01-guardrails.md).

- **Value / Effort** — 1–5, outside-in estimate. Effort 5 = multi-sprint.
- **Score** — `(Value × 2) − Effort`. Tier: Now ≥ 7, Next ≥ 4, else Later.
- **Phase** — dependency-ordered, not purely Score-ordered.
- **Status** — 🔴 BLOCKED (a prerequisite in [`04-phase-0.md`](04-phase-0.md) must land first) · 🟠 RE-SCORE (Effort priced against a core service that turns out to be net-new).

## Index

| ID | Portal | Capability | Autonomy | Score | Phase | Status |
|---|---|---|---|:--:|:--:|---|
| [`AI-001`](#ai-001) | All portals | Ask ePathways — natural-language search | L1 | 7 | 1 |  |
| [`AI-002`](#ai-002) | All portals | Record summary on open | L1 | 8 | 1 |  |
| [`AI-003`](#ai-003) | All portals | Next-best-action panel | L1 | 7 | 1 |  |
| [`AI-004`](#ai-004) | All portals | Context-aware message composer | L2 | 8 | 1 |  |
| [`AI-005`](#ai-005) | All portals | Inbound triage and routing | L3 | 7 | 1 |  |
| [`AI-006`](#ai-006) | All portals | OCR and field extraction | L3 | 7 | 1 | 🔴 blocked |
| [`AI-007`](#ai-007) | All portals | Document quality and validity pre-check | L4 | 8 | 1 | 🔴 blocked |
| [`AI-008`](#ai-008) | All portals | Task extraction from notes and calls | L3 | 6 | 1 |  |
| [`AI-009`](#ai-009) | All portals | Duplicate detection and merge proposal | L3 | 5 | 2 |  |
| [`AI-010`](#ai-010) | All portals | Data-quality and staleness nudges | L4 | 6 | 1 |  |
| [`AI-011`](#ai-011) | All portals | Two-way translation | L2 | 6 | 2 |  |
| [`AI-012`](#ai-012) | All portals | Policy and SOP retrieval with citations | L1 | 7 | 1 | 🟠 re-score |
| [`AI-013`](#ai-013) | All portals | Anomaly digest | L1 | 4 | 3 |  |
| [`AI-014`](#ai-014) | Super Admin | Cross-department KPI narrative | L2 | 7 | 2 |  |
| [`AI-015`](#ai-015) | Super Admin | AI-eligibility distribution explainer | L1 | 3 | 3 | 🔴 blocked |
| [`AI-016`](#ai-016) | Super Admin | Downtime comms pack | L2 | 5 | 2 |  |
| [`AI-017`](#ai-017) | Super Admin | Access and permission review | L1 | 5 | 3 |  |
| [`AI-018`](#ai-018) | Super Admin | AI usage, cost and quality monitor | L1 | 8 | 1 |  |
| [`AI-019`](#ai-019) | Admin | Queue triage and risk ranking | L3 | 7 | 1 | 🟠 re-score |
| [`AI-020`](#ai-020) | Admin | Invitation readiness check | L1 | 4 | 2 |  |
| [`AI-021`](#ai-021) | Admin | Role recommendation on account creation | L1 | 4 | 3 |  |
| [`AI-022`](#ai-022) | Admin | Caption and creative generator | L2 | 8 | 1 |  |
| [`AI-023`](#ai-023) | Admin | Calendar builder and slot optimiser | L3 | 5 | 2 |  |
| [`AI-024`](#ai-024) | Admin | Comment and DM triage | L3 | 7 | 1 |  |
| [`AI-025`](#ai-025) | Admin | Ad copy variants and audience notes | L2 | 6 | 2 |  |
| [`AI-026`](#ai-026) | Admin | Performance read-out | L2 | 4 | 3 |  |
| [`AI-027`](#ai-027) | Admin | Moderation and reply drafting | L3 | 6 | 2 |  |
| [`AI-028`](#ai-028) | Admin | Segment builder and subject testing | L3 | 5 | 2 | 🔴 blocked |
| [`AI-029`](#ai-029) | Admin | Ticket triage and resolution suggestion | L3 | 6 | 2 | 🟠 re-score |
| [`AI-030`](#ai-030) | Admin | Provider content enrichment | L3 | 7 | 1 |  |
| [`AI-031`](#ai-031) | Admin | Reminder sequences and no-show prediction | L4 | 6 | 2 | 🔴 blocked |
| [`AI-032`](#ai-032) | Admin | Success story drafting | L2 | 4 | 3 | 🔴 blocked |
| [`AI-033`](#ai-033) | Sales | Lead scoring and prioritisation | L1 | 7 | 1 |  |
| [`AI-034`](#ai-034) | Sales | Pathy — website and WhatsApp qualification agent | L3 | 6 | 1 |  |
| [`AI-035`](#ai-035) | Sales | Proposal and engagement drafting | L2 | 7 | 1 |  |
| [`AI-036`](#ai-036) | Sales | Follow-up cadence engine | L3 | 8 | 1 | 🔴 blocked |
| [`AI-037`](#ai-037) | Sales | Assessment pre-fill and gap list | L2 | 6 | 2 |  |
| [`AI-038`](#ai-038) | Sales | Program shortlist for a lead | L1 | 7 | 1 |  |
| [`AI-039`](#ai-039) | Sales | Consultation scheduling assistant | L3 | 6 | 2 |  |
| [`AI-040`](#ai-040) | Sales | Call prep and objection coaching | L1 | 6 | 2 | 🟠 re-score |
| [`AI-041`](#ai-041) | Sales | Campaign concept and copy | L2 | 4 | 3 |  |
| [`AI-042`](#ai-042) | Sales | Pipeline forecast and win/loss read | L2 | 5 | 2 |  |
| [`AI-043`](#ai-043) | Education | Program and school matching with rationale | L1 | 6 | 1 | 🟠 re-score |
| [`AI-044`](#ai-044) | Education | Credential mapping and equivalence check | L1 | 7 | 1 | 🟠 re-score |
| [`AI-045`](#ai-045) | Education | Application readiness checklist builder | L3 | 7 | 1 | 🟠 re-score |
| [`AI-046`](#ai-046) | Education | SOP drafting and review coach | L2 | 7 | 1 |  |
| [`AI-047`](#ai-047) | Education | Offer letter and provider correspondence parsing | L3 | 7 | 1 |  |
| [`AI-048`](#ai-048) | Education | Weekly Education operations report | L2 | 7 | 1 |  |
| [`AI-049`](#ai-049) | Education | Pipeline stall detection | L1 | 8 | 1 |  |
| [`AI-050`](#ai-050) | Education | Catalogue freshness watch | L1 | 5 | 2 |  |
| [`AI-051`](#ai-051) | Education | Provider correspondence drafting | L2 | 7 | 1 |  |
| [`AI-052`](#ai-052) | Education | Template generation and gap review | L2 | 4 | 3 | 🟠 re-score |
| [`AI-053`](#ai-053) | Education | Student feedback synthesis | L1 | 4 | 3 |  |
| [`AI-054`](#ai-054) | Education | Outcome analytics by provider and pathway | L1 | 5 | 2 |  |
| [`AI-055`](#ai-055) | English | Placement test generation and marking | L3 | 5 | 2 |  |
| [`AI-056`](#ai-056) | English | Speaking and writing feedback | L2 | 7 | 2 |  |
| [`AI-057`](#ai-057) | English | Personalised study plan | L2 | 6 | 2 |  |
| [`AI-058`](#ai-058) | English | Lesson and material generation | L2 | 6 | 2 |  |
| [`AI-059`](#ai-059) | English | Attendance and progress nudges | L4 | 5 | 3 | 🔴 blocked |
| [`AI-060`](#ai-060) | English | Test-readiness estimate | L1 | 3 | 3 |  |
| [`AI-061`](#ai-061) | Immigration | Indicative eligibility pre-assessment | L1 | 6 | 1 | 🟠 re-score |
| [`AI-062`](#ai-062) | Immigration | File completeness check against INZ checklist | L1 | 7 | 1 |  |
| [`AI-063`](#ai-063) | Immigration | Form pre-fill from verified record data | L3 | 7 | 1 |  |
| [`AI-064`](#ai-064) | Immigration | PPI / RFI response drafting | L2 | 6 | 1 |  |
| [`AI-065`](#ai-065) | Immigration | Evidence gap and risk flagging | L1 | 6 | 1 | 🟠 re-score |
| [`AI-066`](#ai-066) | Immigration | INZ instruction lookup with citation | L1 | 7 | 1 | 🟠 re-score |
| [`AI-067`](#ai-067) | Immigration | Deadline and expiry tracking | L4 | 8 | 1 | 🔴 blocked |
| [`AI-068`](#ai-068) | Immigration | Client status updates | L3 | 6 | 1 |  |
| [`AI-069`](#ai-069) | Immigration | Engagement letter and invoice generation | L2 | 8 | 1 |  |
| [`AI-070`](#ai-070) | Immigration | File note drafting for the licensing record | L2 | 7 | 1 |  |
| [`AI-071`](#ai-071) | Immigration | Visa type and pricing setup assistance | L2 | 4 | 3 | 🟠 re-score |
| [`AI-072`](#ai-072) | Immigration | Outcome and processing-time analytics | L1 | 5 | 2 |  |
| [`AI-073`](#ai-073) | Immigration | Intake screening and prioritisation | L1 | 5 | 2 |  |
| [`AI-074`](#ai-074) | Accommodation | Angi — tenant enquiry agent | L3 | 7 | 1 |  |
| [`AI-075`](#ai-075) | Accommodation | Tenancy agreement and onboarding pack | L2 | 8 | 1 |  |
| [`AI-076`](#ai-076) | Accommodation | Arrears detection and reminder ladder | L3 | 7 | 1 | 🔴 blocked |
| [`AI-077`](#ai-077) | Accommodation | Viewing scheduling and route planning | L3 | 6 | 2 |  |
| [`AI-078`](#ai-078) | Accommodation | Listing copy from photos and specs | L2 | 6 | 2 |  |
| [`AI-079`](#ai-079) | Accommodation | Maintenance request triage | L3 | 7 | 1 |  |
| [`AI-080`](#ai-080) | Accommodation | Consumption forecast and reorder | L4 | 4 | 3 |  |
| [`AI-081`](#ai-081) | Accommodation | Owner statement reconciliation | L2 | 5 | 2 |  |
| [`AI-082`](#ai-082) | Accommodation | Occupancy and pricing intelligence | L1 | 3 | 3 |  |
| [`AI-083`](#ai-083) | Finance | Invoice generation and dispatch | L3 | 7 | 1 | 🔴 blocked |
| [`AI-084`](#ai-084) | Finance | Payment matching and receipting | L3 | 7 | 1 |  |
| [`AI-085`](#ai-085) | Finance | Receivables chase ladder | L3 | 6 | 2 | 🔴 blocked |
| [`AI-086`](#ai-086) | Finance | Agent commission calculation | L2 | 5 | 2 |  |
| [`AI-087`](#ai-087) | Finance | Refund and cancellation calculation | L1 | 5 | 2 | 🟠 re-score |
| [`AI-088`](#ai-088) | Finance | Expense capture and categorisation | L3 | 6 | 2 | 🟠 re-score |
| [`AI-089`](#ai-089) | Finance | Revenue forecast by department | L2 | 5 | 2 |  |
| [`AI-090`](#ai-090) | Finance | Month-end close checklist agent | L3 | 4 | 3 |  |
| [`AI-091`](#ai-091) | Finance | PHP / NZD exposure view | L1 | 3 | 3 |  |
| [`AI-092`](#ai-092) | Agent (external) | Guided lead submission | L3 | 8 | 1 |  |
| [`AI-093`](#ai-093) | Agent (external) | Document collection coach | L1 | 8 | 1 |  |
| [`AI-094`](#ai-094) | Agent (external) | Indicative fit check | L1 | 5 | 2 |  |
| [`AI-095`](#ai-095) | Agent (external) | Process and training assistant | L1 | 6 | 2 | 🟠 re-score |
| [`AI-096`](#ai-096) | Agent (external) | Commission and pipeline Q&A | L1 | 4 | 3 |  |
| [`AI-097`](#ai-097) | Lead (client) | Journey concierge | L1 | 7 | 1 |  |
| [`AI-098`](#ai-098) | Lead (client) | Upload assistant with pre-submission check | L4 | 8 | 1 | 🔴 blocked |
| [`AI-099`](#ai-099) | Lead (client) | Checklist explainer | L1 | 8 | 1 |  |
| [`AI-100`](#ai-100) | Lead (client) | Self-service booking | L3 | 6 | 2 |  |
| [`AI-101`](#ai-101) | Lead (client) | Payment and invoice Q&A | L1 | 6 | 2 |  |
| [`AI-102`](#ai-102) | Lead (client) | Front-line FAQ agent with hard escalation | L3 | 6 | 1 | 🟠 re-score |
| [`AI-103`](#ai-103) | Lead (client) | Personalised content and event surfacing | L4 | 4 | 3 |  |
| [`AI-104`](#ai-104) | Lead (client) | Pre-departure and arrival guidance | L2 | 6 | 2 |  |
| [`AI-105`](#ai-105) | Lead (client) | Multilingual client support | L2 | 6 | 2 |  |

---

## All portals

*Cross-cutting capabilities. Available in every portal, scoped to the caller's role.*

### AI-001 — Ask ePathways — natural-language search

**Module:** Global

One search box that answers 'which Cebu students are missing IELTS?' by querying leads, students, cases, documents and tasks. Results are hard-filtered by the caller's role before the model ever sees them.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | RBAC-scoped query API, vector index over records, LLM |
| Compliance | Row-level scoping mandatory |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **GATED on row-level authorization. This capability removes the obscurity currently hiding the lead IDOR. Sub-Audit 2.5 §4-H5.** |

### AI-002 — Record summary on open

**Module:** Any record

A 5-line brief at the top of any lead, student, case or tenancy: who they are, where they are in the pipeline, what happened last, what is overdue.

| | |
|---|---|
| Trigger | Event — record opened |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Record + timeline API, LLM, cache |
| Compliance | — |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-003 — Next-best-action panel

**Module:** Any record

Ranks the 3 things most likely to move this record forward, each with a one-click action and a plain-English reason.

| | |
|---|---|
| Trigger | Event — record opened |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Stage rules, historical outcomes, LLM |
| Compliance | Reason must be shown, never a bare score |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-004 — Context-aware message composer

**Module:** Email / SMS

Drafts the reply or outbound message from the approved template library plus this record's real facts. Never invents a fact that is not in the record.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes — user sends |
| Requires | Template store, record context, LLM |
| Compliance | Templates stay the source of truth for legal wording |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-005 — Inbound triage and routing

**Module:** Email — Replies

Reads incoming mail and WhatsApp, classifies intent, attaches it to the right lead/case, routes to the owning department and queues a suggested reply.

| | |
|---|---|
| Trigger | Event — message received |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for reply, No for routing |
| Requires | Mailbox + WhatsApp webhook, n8n, classifier |
| Compliance | PII stays in-region |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | Routing is safe (read). The auto-reply inherits the duplicate-send bug. Bug Audit §6-H. |

### AI-006 — OCR and field extraction

**Module:** Documents

Pulls structured data out of passports, transcripts, IELTS/PTE reports, payslips and bank statements, and writes it into the record as proposed values for confirmation.

| | |
|---|---|
| Trigger | Event — file uploaded |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | OCR engine, schema map, confidence thresholds |
| Compliance | Store confidence + original page reference |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — client documents stored on world-readable public disk. Sub-Audit 1 C1. Privacy issue, fix independently of this project. OCR pipeline is net-new (no vision/OCR dependency in repo) — RE-SCORE effort.** |

### AI-007 — Document quality and validity pre-check

**Module:** Documents

Before a document reaches a human queue: is it legible, complete, unexpired, the right document type, and does the name match the file? Returns a pass/fix list to the uploader.

| | |
|---|---|
| Trigger | Event — file uploaded |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | OCR, rules engine, expiry calendar |
| Compliance | Never asserts authenticity — quality only |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — client documents stored on world-readable public disk. Sub-Audit 1 C1. Privacy issue, fix independently of this project. OCR pipeline is net-new (no vision/OCR dependency in repo) — RE-SCORE effort.** |

### AI-008 — Task extraction from notes and calls

**Module:** Task Board

Turns a meeting note, call summary or email thread into discrete tasks with owner, due date and linked record.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | LLM, task API, staff directory |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 1 |

### AI-009 — Duplicate detection and merge proposal

**Module:** Leads / Students

Fuzzy-matches on name, DOB, passport and phone across agents and channels, then proposes a merge with a field-by-field diff.

| | |
|---|---|
| Trigger | Scheduled — nightly |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Matching service, merge API |
| Compliance | Merge must be reversible and logged |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-010 — Data-quality and staleness nudges

**Module:** Any record

Flags missing mandatory fields, records with no contact in N days, and checklist items past due — as a daily queue per owner, not a wall of alerts.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | Field rules, activity log |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 1 |

### AI-011 — Two-way translation

**Module:** Messages

Translates between English and Tagalog / Bisaya / Hindi / Mandarin in both directions, keeping the English original attached for the file.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Translation model, glossary of ePathways terms |
| Compliance | Keep source text on file for audit |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-012 — Policy and SOP retrieval with citations

**Module:** Knowledge

Answers staff questions from ePathways SOPs, provider prospectuses, INZ operational manual and school entry criteria — always with the clause or instruction number it came from.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | RAG index, document loader, citation renderer |
| Compliance | Refuses to answer where no source is retrieved |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-013 — Anomaly digest

**Module:** Activity Log

A short daily read on unusual access patterns, bulk exports, out-of-hours logins and mass edits.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Activity log, baseline model |
| Compliance | Security review before enabling |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |


## Super Admin

### AI-014 — Cross-department KPI narrative

**Module:** Super Dashboard

Writes the 'what changed and why it matters' paragraph over the whole business: conversion, case throughput, occupancy, cash, with the two anomalies worth your attention.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L2 — Draft** |
| Human approval | No |
| Requires | Warehouse queries, LLM |
| Compliance | — |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 2 |

### AI-015 — AI-eligibility distribution explainer

**Module:** Super Dashboard

Explains why the eligibility mix shifted — which cohort, which criterion, which intake — instead of just moving a bar chart.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Eligibility engine outputs, LLM |
| Compliance | Indicative only |
| Value / Effort / Score | 3 / 3 / 3 (Later) |
| Phase | 3 |
| Prerequisite | 🔴 **BLOCKED — eligibility score key mismatch; chart always reads <30. Bug Audit §2-H. One-line fix.** |

### AI-016 — Downtime comms pack

**Module:** Maintenance Mode

Generates the public notice, the ETA wording, the staff heads-up and the client email in one go, in the house voice.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Template store, LLM |
| Compliance | — |
| Value / Effort / Score | 3 / 1 / 5 (Next) |
| Phase | 2 |

### AI-017 — Access and permission review

**Module:** Governance

Quarterly sweep: accounts whose role no longer matches what they actually touch, dormant logins, agents who should be revoked.

| | |
|---|---|
| Trigger | Scheduled — quarterly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Role table, activity log |
| Compliance | Feeds the security audit |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 3 |

### AI-018 — AI usage, cost and quality monitor

**Module:** Governance

Tracks token spend by department, refusal and escalation rates, and the human override rate — the single best signal that a capability is not ready.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Agent telemetry, eval harness |
| Compliance | Required before scaling autonomy |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |


## Admin

### AI-019 — Queue triage and risk ranking

**Module:** Document Queue

Pre-reads every submitted document, auto-clears the clean ones under rule, and pushes the genuinely questionable to the top of a human's queue with the reason attached.

| | |
|---|---|
| Trigger | Event — submission |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for reject |
| Requires | OCR, rules engine, queue API |
| Compliance | Auto-clear limited to low-risk document classes |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | OCR pipeline is net-new (no vision/OCR dependency in repo) — RE-SCORE effort. |

### AI-020 — Invitation readiness check

**Module:** Portal Invitations

Confirms the client is real, consented, de-duplicated and at the right stage before an account is generated.

| | |
|---|---|
| Trigger | Event — request raised |
| Autonomy | **L1 — Suggest** |
| Human approval | Yes |
| Requires | Lead record, consent flags |
| Compliance | Consent evidence required |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 2 |

### AI-021 — Role recommendation on account creation

**Module:** User Management

Suggests the least-privilege role from the job description and warns when admin is being handed out where a department role would do.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Role matrix, LLM |
| Compliance | Least privilege by default |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |

### AI-022 — Caption and creative generator

**Module:** Social — Compose

Writes post variants in English and Taglish, on-brand, with hashtags and a CTA, sized per channel.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Brand voice guide, LLM, image tagger |
| Compliance | No client image or story without written consent |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-023 — Calendar builder and slot optimiser

**Module:** Social — Scheduled

Fills a month of the content calendar against past engagement by day-part and audience, leaving gaps for reactive posts.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Post history, scheduler API |
| Compliance | — |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-024 — Comment and DM triage

**Module:** Social — Inbox

Sorts genuine enquiries from noise, auto-replies to FAQs, and converts qualified DMs into leads with the conversation attached.

| | |
|---|---|
| Trigger | Event — message |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for lead creation |
| Requires | Social APIs, classifier, lead API |
| Compliance | No eligibility opinions in public replies |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | Reply path inherits the duplicate-send bug. Bug Audit §6-H. |

### AI-025 — Ad copy variants and audience notes

**Module:** Social — Ads

Generates headline/primary-text sets per segment and explains which audience each is aimed at.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Ad platform API, LLM |
| Compliance | Ad claims must match what is actually offered |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-026 — Performance read-out

**Module:** Social — Performance

Turns the metrics into three sentences a human would say out loud, plus what to stop doing.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L2 — Draft** |
| Human approval | No |
| Requires | Analytics API, LLM |
| Compliance | — |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |

### AI-027 — Moderation and reply drafting

**Module:** User Reviews

Scores sentiment, catches spam and abuse, and drafts an on-brand reply — escalating anything alleging a service failure.

| | |
|---|---|
| Trigger | Event — review posted |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Review store, classifier, LLM |
| Compliance | Never dispute a complaint publicly without human review |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-028 — Segment builder and subject testing

**Module:** Email — Bulk Mail

Builds the send list from a plain-English description of the audience, then proposes subject-line variants and a test split.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Segment query API, ESP |
| Compliance | Unsubscribe and consent state enforced in query |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |
| Prerequisite | 🔴 **BLOCKED — no consent / unsubscribe register exists. Phase 0 item.** |

### AI-029 — Ticket triage and resolution suggestion

**Module:** System Tickets

Categorises, sets priority, spots duplicates and proposes a fix from past resolved tickets.

| | |
|---|---|
| Trigger | Event — ticket raised |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for close |
| Requires | Ticket store, RAG over history |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-030 — Provider content enrichment

**Module:** Programs / Schools

Reads a prospectus or provider email and fills in fees, intakes, entry requirements, duration and NZQA level as proposed field values.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | PDF parser, program schema |
| Compliance | Provider source document must be linked |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-031 — Reminder sequences and no-show prediction

**Module:** Events / Bookings

Runs the reminder ladder and flags likely no-shows early enough to double-book or re-confirm.

| | |
|---|---|
| Trigger | Scheduled |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | Booking API, SMS/email, model |
| Compliance | Opt-out honoured |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | 🔴 **BLOCKED — duplicate-send queue bug. Bug Audit §6-H.** |

### AI-032 — Success story drafting

**Module:** Visa Approved

Turns an approval into a post and a testimonial request — but only for clients with a recorded consent flag.

| | |
|---|---|
| Trigger | Event — approval logged |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Case outcome, consent register, LLM |
| Compliance | Consent gate is a hard block, not a warning |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |
| Prerequisite | 🔴 **BLOCKED — no consent register; the 'hard block' has no column to read. Phase 0 item.** |


## Sales

### AI-033 — Lead scoring and prioritisation

**Module:** Leads

Scores every lead on fit and intent — funds, academics, English, timeline, responsiveness — and reorders the work queue each morning.

| | |
|---|---|
| Trigger | Scheduled — hourly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Lead features, historical conversions, model |
| Compliance | Score must be explainable field-by-field |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-034 — Pathy — website and WhatsApp qualification agent

**Module:** Leads

Handles first contact, asks the qualifying questions, captures the lead, and books the consultation. Hands off to a human the moment it is asked anything advisory.

| | |
|---|---|
| Trigger | Event — visitor message |
| Autonomy | **L3 — Act on approval** |
| Human approval | No for capture, Yes for commitments |
| Requires | Chat widget, WhatsApp/n8n, lead API, booking API |
| Compliance | Hard escalation on any visa-advice question |
| Value / Effort / Score | 5 / 4 / 6 (Next) |
| Phase | 1 |

### AI-035 — Proposal and engagement drafting

**Module:** Proposals & Agreements

Assembles the proposal from the lead's chosen pathway, current fees and the standard clause library, ready for review.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Fee table, clause library, doc generator |
| Compliance | Fees pulled from the live table, never generated |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-036 — Follow-up cadence engine

**Module:** Leads

Builds the follow-up sequence per lead segment and nudges the owner — or sends the touch itself — when a lead goes quiet.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for first run |
| Requires | Cadence rules, ESP/SMS, lead stage |
| Compliance | Frequency caps and opt-out |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — queue timeout > retry_after = duplicate mass send. Bug Audit §6-H. No autonomous send until fixed.** |

### AI-037 — Assessment pre-fill and gap list

**Module:** Assessments

Pre-populates the assessment from what is already known and lists exactly which questions still need asking on the call.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Assessment schema, lead record |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-038 — Program shortlist for a lead

**Module:** Programs

Produces a ranked shortlist against budget, academic background, English level, intake timing and location, with the reason for each.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Program catalogue, matching engine |
| Compliance | Presented as options, not a recommendation to migrate |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-039 — Consultation scheduling assistant

**Module:** Bookings

Finds a slot across consultant calendars and time zones (NZ / PH), books it and sends the confirmation.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Calendar API, booking API |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | TZ decision required (UTC vs NZ). Bug Audit §3. |

### AI-040 — Call prep and objection coaching

**Module:** Work / Task Board

Before a call: the one-page brief, the likely objections for this profile, and the three questions worth asking.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Record context, playbook RAG |
| Compliance | Coaching is internal-facing only |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-041 — Campaign concept and copy

**Module:** Outreach — Campaigns

Builds the campaign brief, audience definition and full message set for an intake push.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Segment API, LLM, template store |
| Compliance | — |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |
| Prerequisite | Consent register required before send. Phase 0 item. |

### AI-042 — Pipeline forecast and win/loss read

**Module:** Reports

Forecasts the intake by stage-weighted pipeline and explains the pattern behind recent losses.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L2 — Draft** |
| Human approval | No |
| Requires | Pipeline data, LLM |
| Compliance | — |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |


## Education

### AI-043 — Program and school matching with rationale

**Module:** Students / Programs

The core education engine: matches the student to programs and providers on academics, funds, English, intake and long-term pathway, and writes the rationale the consultant can actually say to the client.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Program + school catalogue, matching engine, RAG on entry criteria |
| Compliance | Framed as education options; migration outcomes are not promised |
| Value / Effort / Score | 5 / 4 / 6 (Next) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-044 — Credential mapping and equivalence check

**Module:** Documents

Maps Philippine and Indian qualifications to the NZ framework level, flags what needs NZQA IQA, and lists the certified copies required.

| | |
|---|---|
| Trigger | Event — document verified |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | NZQA reference data, RAG |
| Compliance | Indicative only — provider or NZQA decides |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-045 — Application readiness checklist builder

**Module:** Assessments

Generates the per-student, per-provider checklist from the school's actual current requirements rather than a generic template.

| | |
|---|---|
| Trigger | Event — program selected |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Checklist templates, school requirements, RAG |
| Compliance | Requirements re-checked against source each time |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-046 — SOP drafting and review coach

**Module:** Students

Interviews the student, structures their own material into a first draft, then reviews for authenticity, genuine-intent signals and the gaps an assessor will notice.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes — student owns final text |
| Requires | Interview flow, LLM, authenticity checks |
| Compliance | Must remain the student's own account; no fabricated history |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-047 — Offer letter and provider correspondence parsing

**Module:** Students

Reads incoming offers, CoEs, conditions and rejections, updates the student record and raises the tasks the condition implies.

| | |
|---|---|
| Trigger | Event — email received |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Mail parser, student API |
| Compliance | Original document retained |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-048 — Weekly Education operations report

**Module:** Reports

Builds the standing weekly pack from live pipeline data plus meeting notes: student pipeline, applications completed, offers, blockers and next week's tasks — in the existing Word and PowerPoint formats.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Pipeline queries, notes, docx/pptx generator |
| Compliance | — |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-049 — Pipeline stall detection

**Module:** Students

Finds students who have stopped moving — offer unaccepted, deposit unpaid, document outstanding — before the intake deadline makes it terminal.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Stage timestamps, intake calendar |
| Compliance | — |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-050 — Catalogue freshness watch

**Module:** Setup — Programs / Schools

Re-checks provider pages and prospectuses on a cycle and flags changed fees, intakes or entry requirements for update.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L1 — Suggest** |
| Human approval | Yes to apply |
| Requires | Web fetch, diff, program store |
| Compliance | Change must be evidenced by the provider source |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-051 — Provider correspondence drafting

**Module:** Email

Drafts the application cover, condition clarification, deferral and escalation emails to schools in the house style.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Template store, student context |
| Compliance | — |
| Value / Effort / Score | 4 / 1 / 7 (Now) |
| Phase | 1 |

### AI-052 — Template generation and gap review

**Module:** Setup — Checklist Templates

Drafts a new checklist template for a provider or visa pathway and compares existing templates against current requirements.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Requirements RAG, template schema |
| Compliance | — |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-053 — Student feedback synthesis

**Module:** User Reviews

Themes the reviews by provider and by consultant so the pattern is visible rather than anecdotal.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Review store, clustering |
| Compliance | — |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |

### AI-054 — Outcome analytics by provider and pathway

**Module:** Visa Approved

Tracks approval rates by school, program and profile so the advice given upstream is grounded in what actually gets approved.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Case outcomes, warehouse |
| Compliance | Internal analytics only |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |


## English

### AI-055 — Placement test generation and marking

**Module:** Assessments

Generates a levelled placement test, marks it and places the learner on the CEFR band with the evidence.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Item bank, LLM, rubric |
| Compliance | Human confirms placement |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-056 — Speaking and writing feedback

**Module:** Assessments

Scores against the IELTS/PTE rubric and returns specific, actionable feedback per criterion rather than a bare band.

| | |
|---|---|
| Trigger | Event — submission |
| Autonomy | **L2 — Draft** |
| Human approval | Yes — teacher confirms |
| Requires | Speech-to-text, rubric prompts, LLM |
| Compliance | Never presented as an official band prediction |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 2 |

### AI-057 — Personalised study plan

**Module:** Learners

Builds a week-by-week plan to the learner's target band from their diagnostic profile, and re-plans when progress stalls.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Learner profile, content library |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-058 — Lesson and material generation

**Module:** Classes

Produces level-appropriate lessons, drills and practice sets aligned to the class plan.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Curriculum map, LLM |
| Compliance | No copyrighted material reproduced |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-059 — Attendance and progress nudges

**Module:** Learners

Chases missed classes and unfinished practice through the learner's preferred channel.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | Attendance data, messaging |
| Compliance | Frequency capped |
| Value / Effort / Score | 3 / 1 / 5 (Next) |
| Phase | 3 |
| Prerequisite | 🔴 **BLOCKED — duplicate-send queue bug. Bug Audit §6-H.** |

### AI-060 — Test-readiness estimate

**Module:** Assessments

Estimates likelihood of hitting the target band by the test date and says what would change it.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Progress history, model |
| Compliance | Clearly labelled as an estimate |
| Value / Effort / Score | 3 / 3 / 3 (Later) |
| Phase | 3 |


## Immigration

*Every capability here is internal preparation for the Licensed Immigration Adviser. Nothing in this section produces advice to a client.*

### AI-061 — Indicative eligibility pre-assessment

**Module:** Visa Assessment

Runs the client's facts against current INZ instructions and produces a structured internal pre-assessment with the instruction reference for every point — as preparation FOR the adviser, never as output TO the client.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | Yes — LIA sign-off |
| Requires | INZ instructions RAG, rules engine, case data |
| Compliance | ⚠️ **CRITICAL — internal only. Not advice until the LIA adopts it.** |
| Value / Effort / Score | 5 / 4 / 6 (Next) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-062 — File completeness check against INZ checklist

**Module:** Case — List of Cases

Checks the assembled file against the requirements for that visa category and lists what is missing, expired or inconsistent.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Checklist templates, document index |
| Compliance | Checklist sourced from current instructions |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-063 — Form pre-fill from verified record data

**Module:** Setup — INZ Forms

Populates INZ forms from data already verified in the system, leaving every generated field marked for adviser confirmation.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes — LIA confirms |
| Requires | Form field map, verified record store |
| Compliance | Adviser is the declarant; every field is confirmed before lodgement |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-064 — PPI / RFI response drafting

**Module:** Case

Reads the INZ letter, isolates each concern, pulls the evidence already on file and drafts a structured response for the adviser to rework and sign.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes — LIA rewrites and signs |
| Requires | Letter parser, evidence index, LLM |
| Compliance | ⚠️ **CRITICAL — the adviser is the author. Draft is scaffolding only.** |
| Value / Effort / Score | 5 / 4 / 6 (Next) |
| Phase | 1 |

### AI-065 — Evidence gap and risk flagging

**Module:** Case

Flags the weak points an INZ officer is likely to probe — funds trail, genuine intent, relationship evidence, employment history — before lodgement.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Case data, historical outcomes, RAG |
| Compliance | Internal risk view only |
| Value / Effort / Score | 5 / 4 / 6 (Next) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-066 — INZ instruction lookup with citation

**Module:** Knowledge

Answers policy questions from the operational manual, quoting the instruction number and effective date, and refuses when it cannot retrieve a source.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | INZ manual RAG, freshness monitor |
| Compliance | Must cite; no answer without a retrieved source |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-067 — Deadline and expiry tracking

**Module:** Case

Watches visa expiries, PPI response windows, medical and police certificate validity, and section 61 exposure, and escalates early.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | Date fields, calendar, escalation rules |
| Compliance | Alert only — never files anything |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — app TZ is UTC, business is NZ. L4 escalation on visa/PPI deadlines is the risky case. Bug Audit §3.** |

### AI-068 — Client status updates

**Module:** Students / Case

Sends factual progress updates — lodged, acknowledged, in queue, decision received — in plain language, with no interpretation of what it means for the outcome.

| | |
|---|---|
| Trigger | Event — status change |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Case status, template store |
| Compliance | ⚠️ **CRITICAL — status only, strictly no advisory content** |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 1 |

### AI-069 — Engagement letter and invoice generation

**Module:** Case — Engagement / Invoice

Produces the written agreement and invoice from the case type and agreed fee, in the required licensed-adviser format.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Fee table, clause library, doc generator |
| Compliance | Must satisfy the IAA Code of Conduct written-agreement requirements |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-070 — File note drafting for the licensing record

**Module:** Case

Converts calls and meetings into the contemporaneous file notes the Code requires, ready for the adviser to check and approve.

| | |
|---|---|
| Trigger | Event — call ends |
| Autonomy | **L2 — Draft** |
| Human approval | Yes — LIA approves |
| Requires | Transcript, note schema |
| Compliance | Adviser must verify accuracy before the note is filed |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-071 — Visa type and pricing setup assistance

**Module:** Setup — Visas / Intakes

Drafts new visa type records, criteria summaries and fee structures. Price fields are writable only for the immigration manager.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes — manager only |
| Requires | Instruction RAG, visa schema |
| Compliance | Adviser role is read-only — enforced server-side, not by the agent |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-072 — Outcome and processing-time analytics

**Module:** Reports

Reports approval rates, processing times and decline reasons by visa type and officer branch to sharpen expectation-setting.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Case outcomes, warehouse |
| Compliance | — |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-073 — Intake screening and prioritisation

**Module:** Resident Visa Intake

Screens residence enquiries for the pathway that plausibly fits and orders the queue by urgency and expiry pressure.

| | |
|---|---|
| Trigger | Event — enquiry |
| Autonomy | **L1 — Suggest** |
| Human approval | Yes — LIA reviews |
| Requires | Intake form, rules engine |
| Compliance | Screening is not an eligibility determination |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |


## Accommodation

### AI-074 — Angi — tenant enquiry agent

**Module:** Viewings / Tenants

The WhatsApp front door for accommodation: answers property questions, qualifies the enquiry, books the viewing and writes it into the portal.

| | |
|---|---|
| Trigger | Event — enquiry |
| Autonomy | **L3 — Act on approval** |
| Human approval | No for booking, Yes for commitments |
| Requires | WhatsApp/n8n, property store, calendar |
| Compliance | No tenancy terms committed by the agent |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-075 — Tenancy agreement and onboarding pack

**Module:** Onboarding

Generates the agreement, bond lodgement paperwork, house rules and welcome pack for a confirmed tenant.

| | |
|---|---|
| Trigger | Event — tenant confirmed |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Doc generator, tenancy templates |
| Compliance | Must meet Residential Tenancies Act requirements |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-076 — Arrears detection and reminder ladder

**Module:** Rent & Utilities

Reconciles payments to tenants, catches arrears on day one and runs the escalating reminder sequence in the correct legal tone.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes at each escalation |
| Requires | Bank feed, tenancy ledger, messaging |
| Compliance | Formal notices are drafted, never sent automatically |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — duplicate-send queue bug. Bug Audit §6-H.** |

### AI-077 — Viewing scheduling and route planning

**Module:** Calendar / Viewings

Batches viewings by suburb and travel time so a property manager is not crossing Auckland twice in an afternoon.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Calendar, maps API |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-078 — Listing copy from photos and specs

**Module:** Setup — Properties

Writes the listing in the standard Exalt caption format from the property record and its photos, ready to post.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Vision model, listing template |
| Compliance | No misdescription — claims tied to record fields |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-079 — Maintenance request triage

**Module:** Task Tracker

Reads the tenant's message or photo, classifies urgency and trade, and raises the job with the right vendor.

| | |
|---|---|
| Trigger | Event — tenant message |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for dispatch |
| Requires | Vision + classifier, vendor list, task API |
| Compliance | Health-and-safety issues escalate immediately |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-080 — Consumption forecast and reorder

**Module:** Gas Delivery Tracker

Predicts run-out from consumption history and occupancy and schedules the delivery before a tenant is without hot water.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | Delivery history, occupancy |
| Compliance | Spend cap per order |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |

### AI-081 — Owner statement reconciliation

**Module:** PM Payment Schedule

Reconciles rent in against disbursements out and drafts the owner statement with the variances explained.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Ledger, statement template |
| Compliance | Financial output — human sign-off required |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-082 — Occupancy and pricing intelligence

**Module:** Reports

Forecasts vacancy against student intake dates and suggests where rent is under or over the local market.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Occupancy history, market data |
| Compliance | Suggestion only |
| Value / Effort / Score | 3 / 3 / 3 (Later) |
| Phase | 3 |


## Finance

### AI-083 — Invoice generation and dispatch

**Module:** Dashboard

Raises invoices from agreements and milestones across education, immigration and accommodation, with the right entity and currency.

| | |
|---|---|
| Trigger | Event — milestone reached |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Agreement data, accounting API |
| Compliance | Correct legal entity per invoice — EPL, D Immigration or Exalt |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — no legal-entity data model. EPL / D Immigration / Exalt is a hardcoded string. Phase 0 item.** |

### AI-084 — Payment matching and receipting

**Module:** Dashboard

Matches bank and gateway receipts to the right student, case or tenancy, handles part-payments and issues the receipt.

| | |
|---|---|
| Trigger | Scheduled — daily |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for exceptions |
| Requires | Bank feed, ledger, matching engine |
| Compliance | Unmatched items always escalate |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-085 — Receivables chase ladder

**Module:** Dashboard

Runs the aged-debt follow-up from friendly reminder to formal demand draft, keeping the account owner in the loop.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes past first reminder |
| Requires | Ledger, messaging |
| Compliance | Tone and timing per the engagement terms |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | 🔴 **BLOCKED — duplicate-send queue bug. Bug Audit §6-H.** |

### AI-086 — Agent commission calculation

**Module:** Dashboard

Calculates commission per agent per converted lead against the referral terms sheet and produces the remittance advice.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L2 — Draft** |
| Human approval | Yes |
| Requires | Referral terms, conversion data |
| Compliance | Terms sheet is the source of truth |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-087 — Refund and cancellation calculation

**Module:** Dashboard

Applies the refund policy — provider, agency and government components — and shows the working before anyone commits to a number.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | Yes |
| Requires | Fee table, policy RAG |
| Compliance | Provider refund rules must be quoted from source |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-088 — Expense capture and categorisation

**Module:** Dashboard

Reads receipts and supplier invoices, codes them to the right entity and account, and queues the odd ones for review.

| | |
|---|---|
| Trigger | Event — receipt uploaded |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | OCR, chart of accounts |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | OCR pipeline is net-new (no vision/OCR dependency in repo) — RE-SCORE effort. |

### AI-089 — Revenue forecast by department

**Module:** Dashboard

Forecasts collections from the weighted pipeline, intake calendar and tenancy roll, split by entity and currency.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L2 — Draft** |
| Human approval | No |
| Requires | Pipeline, ledger, FX rates |
| Compliance | Forecast, not a commitment |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-090 — Month-end close checklist agent

**Module:** Task Board

Drives the close checklist, chases the outstanding items and flags what will block the pack.

| | |
|---|---|
| Trigger | Scheduled — monthly |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes |
| Requires | Checklist, task API |
| Compliance | — |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |

### AI-091 — PHP / NZD exposure view

**Module:** Dashboard

Tracks cross-entity balances and FX movement on fees quoted in one currency and collected in another.

| | |
|---|---|
| Trigger | Scheduled — weekly |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | FX feed, ledger |
| Compliance | Not financial advice |
| Value / Effort / Score | 3 / 3 / 3 (Later) |
| Phase | 3 |


## Agent (external)

*External recruiters. Row-level scoping to their own leads is non-negotiable.*

### AI-092 — Guided lead submission

**Module:** My Leads

Walks the recruiter through submitting a complete lead, validating passport format, contact details and academic history as they type.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | No |
| Requires | Lead schema, validation rules |
| Compliance | Agent sees only their own leads — scope enforced server-side |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-093 — Document collection coach

**Module:** My Leads

Tells the agent exactly which documents this lead still needs and what a compliant scan looks like, in their language.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Checklist, document index, translation |
| Compliance | No visa eligibility opinions to the agent |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-094 — Indicative fit check

**Module:** My Leads

Gives a rough education-fit read on a candidate before the agent invests time — framed as a screening aid, never as an eligibility ruling.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Matching engine (restricted) |
| Compliance | ⚠️ **CRITICAL — screening only; heavy disclaimer; no immigration outcome implied** |
| Value / Effort / Score | 4 / 3 / 5 (Next) |
| Phase | 2 |

### AI-095 — Process and training assistant

**Module:** Dashboard

Answers 'how does ePathways handle X' from the agent handbook, so onboarding a new recruiter does not consume a staff day.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Agent handbook RAG |
| Compliance | Answers restricted to the agent-facing knowledge base |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-096 — Commission and pipeline Q&A

**Module:** Work

Answers the agent's questions about their own pipeline and earned commission, strictly scoped to their records.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Scoped query API |
| Compliance | Row-level scoping is non-negotiable |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |


## Lead (client)

*Client-facing. Status and process only. The escalation classifier sits in front of every conversational surface here.*

### AI-097 — Journey concierge

**Module:** Dashboard / My Journey

Explains where the client is, what happens next and what is waiting on them — the single biggest reduction in 'any update?' messages.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Journey state, scoped record access |
| Compliance | Status and process only |
| Value / Effort / Score | 5 / 3 / 7 (Now) |
| Phase | 1 |

### AI-098 — Upload assistant with pre-submission check

**Module:** My Journey — Documents

Tells the client what to upload, checks legibility, completeness and expiry at the point of upload, and asks for a re-take before it reaches staff.

| | |
|---|---|
| Trigger | Event — upload |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | OCR, quality rules |
| Compliance | Quality feedback only — never approves a document |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |
| Prerequisite | 🔴 **BLOCKED — client documents stored on world-readable public disk. Sub-Audit 1 C1. Privacy issue, fix independently of this project. OCR pipeline is net-new (no vision/OCR dependency in repo) — RE-SCORE effort.** |

### AI-099 — Checklist explainer

**Module:** My Journey — Checklist

Explains in plain language what each required item is, why it is needed and where to obtain it in the Philippines or India.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Checklist metadata, knowledge base |
| Compliance | Explains requirements; does not interpret them for the client's case |
| Value / Effort / Score | 5 / 2 / 8 (Now) |
| Phase | 1 |

### AI-100 — Self-service booking

**Module:** Engage — Appointments

Books, reschedules and cancels consultations across NZ and PH time zones without a staff member in the loop.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L3 — Act on approval** |
| Human approval | No |
| Requires | Calendar API |
| Compliance | — |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |
| Prerequisite | TZ decision required (UTC vs NZ). Bug Audit §3. |

### AI-101 — Payment and invoice Q&A

**Module:** Engage — Payments

Answers what is owed, what has been paid and what each fee covers, and takes the client to the payment page.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L1 — Suggest** |
| Human approval | No |
| Requires | Scoped ledger view |
| Compliance | Reads the ledger — never quotes a fee it generated |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-102 — Front-line FAQ agent with hard escalation

**Module:** Messages

Handles the genuinely repetitive questions and escalates to a named human the instant the conversation turns to eligibility, chances or what the client should do.

| | |
|---|---|
| Trigger | Event — client message |
| Autonomy | **L3 — Act on approval** |
| Human approval | Yes for anything non-FAQ |
| Requires | FAQ RAG, escalation classifier, ticket API |
| Compliance | ⚠️ **CRITICAL — the escalation classifier is the compliance control. Log every escalation.** |
| Value / Effort / Score | 5 / 4 / 6 (Next) |
| Phase | 1 |
| Prerequisite | RAG index is net-new (no vector infra in repo) — RE-SCORE effort. |

### AI-103 — Personalised content and event surfacing

**Module:** News & Tips / Events

Shows the pre-departure, accommodation and intake content that matches this client's stage and destination city.

| | |
|---|---|
| Trigger | Scheduled |
| Autonomy | **L4 — Autonomous (bounded)** |
| Human approval | No |
| Requires | Content store, journey state |
| Compliance | Published content only |
| Value / Effort / Score | 3 / 2 / 4 (Next) |
| Phase | 3 |

### AI-104 — Pre-departure and arrival guidance

**Module:** My Journey

Walks the approved client through flights, insurance, accommodation, arrival and enrolment week from the standard orientation material.

| | |
|---|---|
| Trigger | Event — visa approved |
| Autonomy | **L2 — Draft** |
| Human approval | Yes for first version |
| Requires | Orientation content, LLM |
| Compliance | Drawn from the approved orientation pack |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

### AI-105 — Multilingual client support

**Module:** All screens

Runs the whole client portal experience in Tagalog, Bisaya or English at the client's choice.

| | |
|---|---|
| Trigger | User-invoked |
| Autonomy | **L2 — Draft** |
| Human approval | No |
| Requires | Translation layer, glossary |
| Compliance | English original retained on file |
| Value / Effort / Score | 4 / 2 / 6 (Next) |
| Phase | 2 |

---

## Phase summary

| Phase | Theme | Capabilities |
|---|---|:--:|
| 1 | Foundations & quick wins | 50 |
| 2 | Department depth | 37 |
| 3 | Optimisation & intelligence | 18 |

Phase 1 is deliberately front-loaded because the core services must land before anything above L1 is
safe to ship. If that is more than the team can absorb, push the lower-Score Phase 1 capabilities out
rather than thinning the core services.

## Autonomy distribution

| Level | Count |
|---|:--:|
| L1 — Suggest | 36 |
| L2 — Draft | 30 |
| L3 — Act on approval | 31 |
| L4 — Autonomous (bounded) | 8 |
