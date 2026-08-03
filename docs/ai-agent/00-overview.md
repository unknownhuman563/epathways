# ePathways AI Agent — Overview

> Specification for the AI assistant layer across the ePathways CRM.
> Companion documents: [`01-guardrails.md`](01-guardrails.md) · [`02-tool-registry.md`](02-tool-registry.md) · [`03-capabilities.md`](03-capabilities.md) · [`04-phase-0.md`](04-phase-0.md)

## 1. What this is

An assistant layer that sits inside the existing portals rather than beside them. Every department
already has a sidebar, a task board and a set of records; the agent works those same screens through
the same policied endpoints a human uses. It is not a separate product and it is not a chatbot bolted
onto the corner of the page.

Scope: 105 capabilities across 10 portals, built on 14 shared services.

**Before reading further, read [`01-guardrails.md`](01-guardrails.md).** The immigration advice
boundary is not a compliance footnote — it is the constraint that determines the architecture, and
several otherwise-obvious capabilities are deliberately capped because of it.

## 2. Architecture

```
                        ┌─────────────────────────────┐
   Portal UI  ─────────▶│   Agent orchestrator        │
   (Inertia/React)      │   plan · retrieve · act      │
                        └──────────┬──────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────┐        ┌──────────────────┐       ┌──────────────────┐
│ Scope broker  │        │ Retrieval        │       │ Tool execution   │
│ role → filter │        │ records + RAG    │       │ registry + audit │
└───────┬───────┘        └────────┬─────────┘       └────────┬─────────┘
        │                         │                          │
        └─────────────────────────┴──────────┬───────────────┘
                                             ▼
                                  ┌──────────────────────┐
                                  │ Approval queue (L3)  │
                                  │ surfaced in Work/    │
                                  │ Task Board           │
                                  └──────────────────────┘
```

### Request flow

1. **Scope resolution.** The caller's `role` resolves to a row-level filter *before* retrieval runs.
   The agent never receives a record the signed-in user could not open unaided.
2. **Retrieval.** Structured record data plus RAG over the audience-appropriate knowledge index.
   Separate indexes per audience — the client-facing index contains no internal or advisory material.
3. **Planning.** The model proposes an action from the tool registry.
4. **Execution.** Read tools run directly. Write tools either execute (L4, bounded) or land in the
   approval queue (L3) with the proposed diff and a rationale.
5. **Audit.** Prompt, retrieval set, tool call, approval and any human override are logged and
   attributable to a user.

### Where it plugs into the existing codebase

| Existing | Agent layer |
|---|---|
| `EnsurePortalAccess` / `portal:<role>` middleware | **Does not help.** It is role-level, not row-level — it answers "may you enter the Sales portal", never "may you open *this* lead". The scope broker is a new authorization layer, not a mirror. See §5. |
| `User::homeRoute()` and role table | Determines which capability set and which knowledge index the agent loads |
| Server-side policies (e.g. `immigration_adviser` read-only) | Unchanged. The agent calls the same policied endpoints as the UI and gets no privileged bypass |
| Work / Task Board screens | Host the approval queue — no new destination for staff to learn |
| Activity Log | Extended with agent events rather than duplicated |
| n8n (Angi, immigration bot) | Becomes the messaging bridge for WhatsApp/SMS rather than a parallel stack |

## 3. Autonomy ladder

Every capability is assigned a level. The level is a property of the capability, not of the model.

| Level | Permitted |
|---|---|
| **L1 — Suggest** | Reads only. Surfaces a summary, score, flag or next-best-action. A human does everything. |
| **L2 — Draft** | Writes content into a draft state. A human edits and is the one who sends or saves. |
| **L3 — Act on approval** | Prepares a real write or outbound send, then blocks on an explicit approve/reject. |
| **L4 — Autonomous (bounded)** | Executes without a click, inside a narrow, logged, reversible scope. Never where advice, money or immigration outcomes are involved. |

Autonomy is earned, not assumed. A capability ships at the level specified in
[`03-capabilities.md`](03-capabilities.md) and only moves up after its human override rate has been
observed in production. If override rate exceeds the published threshold, autonomy rolls back a level
automatically.

## 4. Core services

Build these once. Reimplementing any of them per-portal is the failure mode this document exists to
prevent.

| # | Service | Provides | Status in repo | Phase |
|:--:|---|---|:--:|:--:|
| 1 | **Identity & scope broker** | Builds the row-level authorization the app has never had. NOT a mirror of EnsurePortalAccess — that middleware is role-level ('may you enter the Sales portal'), never row-level ('may you open this lead'). Injects an ownership/department predicate into every query itself. | NET-NEW (critical) | 1 |
| 2 | **Knowledge base / RAG index** | Chunked, versioned index over SOPs, provider prospectuses, INZ operational manual, school entry criteria, agent handbook and internal policy — with per-index access levels. | NET-NEW | 1 |
| 3 | **Document intelligence pipeline** | Upload → OCR → classify → extract → validate → confidence score → propose. One pipeline for passports, transcripts, test reports, payslips, receipts and tenancy documents. | NET-NEW | 1 |
| 4 | **Tool / function execution layer** | The registry of actions the agent may call, each with a permission scope, an approval requirement and an audit entry. | NET-NEW | 1 |
| 5 | **Approval & human-in-the-loop queue** | A shared inbox where L3 actions wait: what the agent wants to do, why, and the diff — with approve, edit or reject. | NET-NEW | 1 |
| 6 | **Prompt & template registry** | Versioned prompts and message templates with owners, so wording changes are a config change and not a deploy. | Partial | 2 |
| 7 | **Memory & context store** | Per-record and per-client conversation memory so the agent does not re-ask what it was told last week. | NET-NEW | 2 |
| 8 | **Escalation classifier** | The compliance control: detects when a conversation has turned advisory, high-risk or distressed, and hands to a named human. | NET-NEW (critical) | 1 |
| 9 | **Eval & regression harness** | A fixed set of real cases with known-good answers, run on every prompt or model change. | NET-NEW | 1 |
| 10 | **Observability & audit trail** | Every prompt, retrieval, tool call, approval and override, queryable and attributable to a user. | Partial | 1 |
| 11 | **Messaging bridge (n8n)** | Connects WhatsApp, SMS, email and social inboxes to portal threads in both directions. | Overstated | 2 |
| 12 | **Document generation service** | Renders approved output into the ePathways house styles: Word, PDF and PowerPoint, correct brand per entity. | EXISTS | 2 |
| 13 | **Analytics & warehouse layer** | The read models the reporting and forecasting capabilities sit on. | NET-NEW | 3 |
| 14 | **Consent & preference register** | Records marketing consent, testimonial consent, channel preference and language, and enforces them at send time. | NET-NEW | 0 |

Detail on consumers and build notes lives in the blueprint workbook, `Core AI Services` tab.

## 5. Build order

**Read [`04-phase-0.md`](04-phase-0.md) first.** A read-only feasibility review against the codebase
(2026-07-21) found that two of the prerequisites are live production issues unrelated to this
project, and that the first service below is substantially larger than originally estimated.

The correction that matters: **the scope broker is a build, not a mirror.** `EnsurePortalAccess` is
role-level. The row-level authorization this entire safety model depends on does not exist in the
app, and prior audits found the per-controller checks that stand in for it are missing on exactly the
lead and document surfaces the agent targets first. Capability `AI-001` — natural-language search —
removes the friction that currently keeps those records out of sight, so it turns a latent IDOR into
a query anyone can run. The broker must inject an ownership/department predicate itself and must not
delegate scoping to endpoints that were proven not to scope.

1. **Row-level authorization layer**, plus retrofit of the leaky controllers, so the agent and the UI
   share one gate. Test it as a security control, not a feature.
2. **Tool execution layer + agent-event audit store.** `LogsActivity` covers record changes, not
   prompts, retrievals, tool calls or approvals.
3. **Approval queue**, rendered inside the existing Work / Task Board screens.
4. **Eval harness.** Built alongside the first capability, not after.
5. **Escalation classifier** — gates every client-facing surface, so nothing in the Lead portal ships
   before it.
6. **Consent register and legal-entity model** — two data models the capability list assumes and the
   schema does not contain.
7. **First capability: `AI-002` record summary.** L1, read-only, visible in every portal, minimal
   blast radius. Proves the scope broker and retrieval path end to end.

Only then work the Phase 1 rows in [`03-capabilities.md`](03-capabilities.md), skipping any marked
BLOCKED until its prerequisite lands.

## 6. Non-goals

- No autonomous outbound communication that commits ePathways to anything — fees, timelines,
  eligibility, tenancy terms.
- No agent-generated numbers. Fees and balances come from a tool call against the live table or the
  agent says it does not know.
- No training on client data.
- No agent write path that bypasses an existing server-side policy.

## 7. Open questions

- Model and hosting choice, given data residency obligations on client documents. **Note: this is
  already a live gap, not a future decision** — assessment data reaches Cerebras and Gemini today, and
  client documents sit on a world-readable disk.
- Retention period for agent memory versus the IAA record-keeping obligation.
- Knowledge index separation. **Recommendation: separate at the storage layer**, not by query
  filter. Role scoping is currently leaky, and a filter bug in a shared index becomes an
  advice-boundary breach — the one line this spec says must never be crossed.
- Human override threshold per autonomy level — needs a number, agreed in advance.

---

*Value and Effort scores in the capability list are an outside-in estimate made from the roles &
features document, not from the codebase. Re-score with the dev team before committing to a
roadmap.*
