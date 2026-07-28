# Phase 0 — Prerequisites

> Revised after a read-only feasibility review against branch `full_blown`, 2026-07-21.
> Nothing in this document is user-visible, which is precisely why it gets skipped.

## Two things that should not wait for a roadmap

**1. Client documents are on a world-readable disk.** Passports, financial records and — for
immigration cases — potentially medical material. This is a live Privacy Act 2020 exposure in
production today. It was found by the AI review but it is not an AI problem; it exists whether or not
an agent is ever built. Raise it as a security ticket, not a roadmap row.

**2. Client data already leaves the country.** Assessment data reaches Cerebras and Gemini in
production now. Guardrail 8 (region-pinned processing) describes a control that does not currently
exist. Given the licensing exposure this is a decision for the LIA and the CEO, not for engineering.

## The correction to the architecture

The original spec said the scope broker would *mirror* `EnsurePortalAccess` and injected a row-level
filter. That is wrong. `EnsurePortalAccess` is **role-level**: it answers "may you enter the Sales
portal", never "may you open *this* lead". Row-level authorization does not exist in the app, and
prior audits found the per-controller checks that stand in for it are missing on the lead and
document surfaces the agent targets first — `/admin/leads/{id}` with no record-level check under a
broad role group, `bulkDelete` scoped only by role, `finance` reaching lead documents.

Today the UI hides most of this by not linking to those records. Capability `AI-001` —
natural-language search — removes exactly that friction. The scope broker is therefore **the new
authorization layer the application has never had**, it must inject the ownership predicate itself,
and it must not delegate scoping to endpoints that were proven not to scope.

Effort 3 was wrong. Re-score it, and treat the lead IDOR fix as part of the same deliverable rather
than a parallel workstream — the agent and the UI should share one gate.

## The list

| # | Item | Type | Why it gates the AI work | Reference | Owner | When |
|:--:|---|---|---|---|---|---|
| 1 | **Move client documents from public to private disk** | Security fix | Passports, financial and medical documents are world-readable in production. A live Privacy Act exposure today, independent of the AI project. Blocks every document capability (AI-006, AI-007, AI-098). | `Sub-Audit 1 C1` | Engineering | This week |
| 2 | **Decision on offshore LLM processing** | Privacy decision | Cerebras and Gemini already receive client assessment data in production. Guardrail 8 (region-pinned processing) is not met today. Determines model and hosting choice for everything downstream. | `CerebrasService, ChatController` | Hendry Dai + Dinah Suarin | This week |
| 3 | **Row-level authorization layer + retrofit leaky controllers** | Build (was 'service #1') | The gate every other capability trusts. AI-001 natural-language search removes the friction that currently hides the lead IDOR — an English staffer could ask for immigration cases. This is a build, not a mirror. | `Sub-Audit 2.5 §4-H5 / §1; Bug Audit §5-H5` | Engineering | Phase 0 first |
| 4 | **Queue config: timeout < retry_after** | Bug fix | Job timeout 600/300s exceeds queue retry_after 90s, producing duplicate mass sends. Every send-capable capability sits on this substrate. | `Bug Audit §6-H` | Engineering | Phase 0 |
| 5 | **Consent / unsubscribe register** | New data model | Every Phase-1 send capability claims to honour opt-out against a column that does not exist. Moved forward from Phase 2 — this was an inconsistency in the original spec, not a review finding. | `Guardrail 9; AI-028/031/032/036` | Engineering + Marketing | Phase 0 |
| 6 | **Escalation classifier** | Build | The compliance control for the entire Lead portal and every client-facing surface. Nothing client-facing ships before it, so it is a Phase 0 dependency even though it is not infrastructure. | `Guardrail 1; AI-104` | Engineering + LIA sign-off | Phase 0 |
| 7 | **Tool execution layer + agent-event audit store** | Build | Registry, permission scopes, idempotent and reversible writes, one audit entry per call. LogsActivity covers record changes, not agent events. | `Core services 4 & 10` | Engineering | Phase 0 |
| 8 | **Approval queue in Work / Task Board** | Build | Where every L3 action waits. Hosted in existing screens so staff learn no new destination. | `Core service 5` | Engineering | Phase 0 |
| 9 | **Eval & regression harness** | Build | Without it you cannot safely change a prompt or model. Build alongside the first capability, not after. | `Core service 9` | Engineering | Phase 0 |
| 10 | **Legal entity data model (EPL / D Immigration / Exalt)** | New data model | raise_invoice must resolve the correct entity from the agreement. Today the entity is a hardcoded string in AccommodationController — there is nothing to resolve from. Gates AI-083. | `Guardrail 4; AI-083` | Engineering + Finance | Phase 0 |
| 11 | **Timezone decision: UTC vs Pacific/Auckland** | Decision + fix | App runs UTC, business runs NZ; only SlotGenerator re-anchors. L4 autonomous escalation on visa and PPI deadlines computed in the wrong zone is the risky combination. | `Bug Audit §3` | Engineering | Phase 0 |
| 12 | **Eligibility score key fix** | Bug fix | Dashboard reads eligibility_score/score; the value is stored as overall_score, so every lead buckets under 30. AI-015 would narrate a chart that is always wrong. | `Bug Audit §2-H` | Engineering | Any time |
| 13 | **Human override threshold per autonomy level** | Governance decision | A published number beats a judgement call under deadline pressure. Needs agreeing before the first L3 capability ships, not after. | `Guardrail 13` | Dinah Suarin / Governance | Before first L3 |
| 14 | **Knowledge index separation: storage vs query filter** | Architecture decision | Guardrail 3 requires the education index to exclude INZ material. Given role scoping is currently leaky, a filter bug becomes an advice-boundary breach. Recommendation: separate at the storage layer. | `Guardrail 3; core service 2` | Engineering + LIA | Before RAG build |
| 15 | **Memory retention vs IAA record-keeping obligation** | Policy decision | LogsActivity has no retention or deletion policy today. Whatever is decided has to be built, not configured. | `Guardrail 8 & 11` | Hendry Dai | Before memory store |

## Core services: what actually exists

Of 14 services, one exists, two are partial, one was overstated, and ten are net-new. The original
overview's "plugs into the existing codebase" framing is true for *where things render* — the Work
board, the Activity Log — and not for *what has to be built underneath*.

| Service | Status |
|---|---|
| Identity & scope broker | NET-NEW (critical) |
| Knowledge base / RAG index | NET-NEW |
| Document intelligence pipeline | NET-NEW |
| Tool / function execution layer | NET-NEW |
| Approval & human-in-the-loop queue | NET-NEW |
| Prompt & template registry | Partial |
| Memory & context store | NET-NEW |
| Escalation classifier | NET-NEW (critical) |
| Eval & regression harness | NET-NEW |
| Observability & audit trail | Partial |
| Messaging bridge (n8n) | Overstated |
| Document generation service | EXISTS |
| Analytics & warehouse layer | NET-NEW |
| Consent & preference register | NET-NEW |

Two corrections worth stating plainly:

- **n8n is not a messaging bridge.** It is wired for the Social MVP only and returns stubs when
  unset. The WhatsApp/SMS bidirectional bridge is net-new.
- **`LogsActivity` is not an agent audit trail.** It covers model attribute changes across 20 models
  — genuinely useful for the `AI-002` timeline — but it logs nothing about prompts, retrievals, tool
  calls or approvals. That store is separate.

## Capability status

13 capabilities are marked **BLOCKED** in `03-capabilities.md`: a known defect or a missing data
model must land first. A further 19 are marked **RE-SCORE**: their Effort estimate priced integration
against a core service that turns out to be net-new, so the number is not meaningful.

Two data models the capability list assumes and the schema does not contain:

- **Legal entity** (Employment Pathways Limited / D Immigration Consultancy / Exalt Property
  Management). `raise_invoice` is specified to resolve the entity from the agreement; there is
  nothing on the agreement to resolve from. Today it is a hardcoded string in a controller.
- **Consent / unsubscribe register.** Every Phase-1 send capability claims to honour opt-out against
  a column that does not exist. This one is an inconsistency in the original spec rather than a
  review finding — it was placed in Phase 2 while its dependents sat in Phase 1.

## Decisions needing a human answer

These are not engineering questions and should be settled before the build they gate, not during it.

| Decision | Owner |
|---|---|
| Offshore LLM processing, given data residency | Hendry Dai + Dinah Suarin |
| Human override threshold per autonomy level | Dinah Suarin / Governance |
| Knowledge index separation — storage vs query filter (recommend storage) | Engineering + LIA |
| Memory retention against the IAA record-keeping obligation | Hendry Dai |
| Timezone: UTC vs Pacific/Auckland | Engineering |
| Which legal entity each fee sits under | Finance |
