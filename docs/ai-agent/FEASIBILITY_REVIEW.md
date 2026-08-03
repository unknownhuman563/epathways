# AI Agent Spec — Feasibility Review

> Read-only review of the AI-agent spec set (`00-overview` · `01-guardrails` · `02-tool-registry` · `03-capabilities`) against the **actual `full_blown` codebase**.
> No code changed. Every claim below is grounded in a file/line or a prior audit in `docs/audits/`.
> **Date:** 2026-07-21

## TL;DR

The spec is unusually well-designed — the autonomy ladder, the advice boundary, and "the agent uses the same policied endpoints a human uses" are the right instincts. But it rests on **one load-bearing assumption that the codebase does not currently support**, and several Phase-1 capabilities sit directly on top of bugs the prior audits already found.

- **🔴 The scope broker cannot be built by "mirroring `EnsurePortalAccess`."** That middleware is **role-level, not row-level.** The row-level scoping the whole safety model depends on does not exist in the app today — and three separate audits this session found the record-level checks that *would* substitute for it are missing in exactly the lead/document surfaces the agent targets first. This is the single most important finding. Fix this before anything above L1 ships. (§1)
- **🟠 ~40% of the 14 "core services" are net-new**, not adaptations of existing infra. No RAG index, no OCR pipeline, no eval harness, no approval queue, no consent register, no agent-event audit store. The overview's "plugs into the existing codebase" table is optimistic about reuse. (§2)
- **🟠 At least 6 Phase-1 capabilities are blocked or degraded by known bugs** (broken eligibility score, duplicate-send queue, UTC/NZ timezone, docs on a public disk). Building L3/L4 autonomy on those substrates ships the bug at scale. (§3)
- **🟡 Two data models the spec assumes simply aren't there:** multi-legal-entity invoicing (EPL / D Immigration / Exalt) and a consent/unsubscribe register. (§4)
- **🟢 The genuinely reusable pieces are real:** LLM plumbing (Cerebras/Gemini/`AIService`), `LogsActivity` on 20 models, a live fee column for immigration, `agent_id` row-scoping for external agents, and n8n wiring (social only). (§5)

The spec's own instinct — front-load the plumbing, ship `AI-002` first — is correct. The plumbing is just bigger than the overview implies, and item #1 (scope broker) is a **build**, not a **mirror**.

---

## 1. 🔴 The foundational claim: "mirror `EnsurePortalAccess`" does not deliver row-level scoping

This is the crux, so it gets its own section.

**What the spec says.** Overview §Request-flow #1: *"The caller's role resolves to a row-level filter before retrieval runs. The agent never receives a record the signed-in user could not open unaided."* Guardrail #5: *"Scope filter injected before retrieval, mirroring the `portal:<role>` middleware."* The build order calls this item #1 and says to *"test it as a security control."*

**What the code actually does.** [`EnsurePortalAccess`](../../app/Http/Middleware/EnsurePortalAccess.php) checks one thing: *does this user hold one of these roles?* ([`User::canAccessPortal`](../../app/Models/User.php#L311)). It is **role-level**. It answers "may you enter the Sales portal," never "may you open *this* lead." Row-level authorization in this app lives (inconsistently) inside individual controllers — and the prior audits found it is **missing** on the exact surfaces the agent hits first:

- **Sub-Audit 2.5 (Routes) §4-H5** + **Bug Audit §5-H5**: `/admin/leads/{id}` uses a manual `{id}` binding → `Lead::where('id',$id)->orWhere('lead_id',$id)->firstOrFail()` with **no record-level check** under a broad `portal:admin,sales,education,…` group. Any staffer gets `200` on any lead id (cross-department IDOR).
- **Bug Audit §1 (SalesController::bulkDelete)** and **Sub-Audit 2.5 §1-H2/H3/H4**: bulk and single lead/document mutations scoped only by the role gate, not by ownership.
- **Sub-Audit 2.5**: the `finance` role reaches lead-document endpoints it has no business touching.

**Why this matters more for the agent than for the UI.** Today the UI mostly hides cross-department records by *not linking to them* — the IDOR is reachable but you have to go looking. The spec's very first capability, **`AI-001` "Ask ePathways — natural-language search,"** removes that friction: *"which Cebu students are missing IELTS?"* is a query across leads/students/cases/documents. If the scope broker "mirrors `EnsurePortalAccess`," it inherits the role-level gate and an English staffer can ask the agent for immigration cases — the model surfaces exactly what the middleware never actually blocked.

**Consequence.** The scope broker is **not** a mirror of existing middleware — it is the **new row-level authorization layer the app has never had.** It must inject an ownership/department predicate into every query itself (`WHERE assigned_to = :me` / `department = :dept` / `agent_id = :me`), and it **must not delegate scoping to the endpoints**, because the audits proved several endpoints don't scope. The spec's instruction to "test it as a security control, not a feature" is exactly right; the estimate that it's a *mirror* of what exists is exactly wrong.

**Recommendation.** Re-scope service #1 from "mirror the middleware" to "build the row-level authorization the middleware doesn't provide, and retrofit the same predicates into the leaky controllers the audits flagged." Treat the lead-IDOR fix (Sub-Audit 2.5 §4-H5) as a **prerequisite**, not a parallel workstream — the agent and the UI should share one row-level gate.

---

## 2. 🟠 The 14 core services vs. what exists

| # | Service | Reality in `full_blown` | Verdict |
|:--:|---|---|---|
| 1 | Identity & scope broker | Role-level middleware only; row-level scoping absent (see §1) | **Net-new (critical)** |
| 2 | Knowledge base / RAG index | **No vector/embedding/RAG infra anywhere** (grep: no pgvector/pinecone/embeddings). Cerebras/Gemini are chat-completion only | **Net-new** |
| 3 | Document intelligence (OCR) | **No OCR/vision/textract dependency** exists | **Net-new** |
| 4 | Tool / function execution layer | None. The *endpoints* to wrap exist; the registry/permission/idempotency layer does not | **Net-new** |
| 5 | Approval & HITL queue | None. Work/Task Board screens exist to host it, but the queue itself is new | **Net-new** |
| 6 | Prompt & template registry | Message templates exist (`MessageTemplate`); versioned *prompt* registry does not | **Partial** |
| 7 | Memory & context store | None | **Net-new** |
| 8 | Escalation classifier | None. This is the compliance control for every client surface | **Net-new (critical)** |
| 9 | Eval & regression harness | None | **Net-new** |
| 10 | Observability & audit | [`LogsActivity`](../../app/Models/Lead.php) on **20 models** — but it logs *model attribute changes*, not prompts/retrievals/tool-calls/approvals. Lead-centric | **Partial — needs a dedicated agent-event store** |
| 11 | Messaging bridge (n8n) | n8n wired **for the Social MVP only** ([`config/services.php:107`](../../config/services.php#L107)), returns stubs when unset. No WhatsApp/SMS bidirectional bridge | **Overstated — social stub, not a bridge** |
| 12 | Document generation | Real and good: `AgreementGenerator`, dompdf, Blade templates already render agreements/invoices | **Exists** |
| 13 | Analytics / warehouse | None (reports query live tables directly) | **Net-new** |
| 14 | Consent & preference register | Only `EoiSubmission.consent_collection` (accommodation). No marketing/testimonial consent, **no unsubscribe/opt-out** | **Net-new (see §4)** |

**Net:** of 14 services, **1 exists** (doc generation), **2 partial** (prompt registry, audit), **1 overstated** (n8n bridge), **10 net-new**. The overview's "plugs into the existing codebase" framing is true for *where things render* (Work board, Activity Log) but not for *what has to be built underneath*.

---

## 3. 🟠 Phase-1 capabilities blocked or degraded by known bugs

Each of these is a Phase-1 item sitting on a defect a prior audit already documented. Building autonomy on top ships the bug at scale.

| Capability | Depends on | Blocker (audit ref) | Effect if built as-specified |
|---|---|---|---|
| **AI-015** Eligibility distribution explainer | SuperAdmin eligibility chart | **Bug Audit §2-H:** dashboard reads `eligibility_score`/`score`; score is stored as `overall_score` → every lead buckets `<30` | The agent would narrate a chart that is **always wrong.** One-line fix first. |
| **AI-036 / AI-031 / AI-059 / AI-076 / AI-085** any reminder/cadence/chase that **sends** | `CommunicationService` / `SendCampaign` | **Bug Audit §6-H:** job `timeout` 600/300s > queue `retry_after` 90s → duplicate mass send | L3/L4 autonomous sends on a **double-send substrate** = clients messaged twice. Fix queue config before any autonomous send. |
| **AI-067** Deadline & expiry tracking (L4) · **AI-039/AI-100** cross-TZ booking | date math | **Bug Audit §3:** app TZ is `UTC`, business is NZ; only `SlotGenerator` re-anchors to Auckland | L4 autonomous escalation on visa/PPI deadlines computed in UTC-vs-NZ is the **exact risky combination** the audit warned about. |
| **AI-098 / AI-007 / AI-006** doc pre-check & OCR (client-facing, L4) | document storage | **Sub-Audit 1 C1:** uploaded docs (passports, financials) live on the **world-readable `public` disk** | An L4 client capability handling passports on a public disk is a privacy exposure, not just a bug. Move to private disk first (also Guardrail #8). |
| **AI-005 / AI-024** inbound triage → auto-reply | `SendCampaign`-style send + `SyncEmailRepliesJob` | Same duplicate-send substrate; reply infra exists but unthrottled (Sub-Audit 2.5 §5) | Routing is safe (read); the *reply* inherits the send risk. |

**Recommendation.** Fold the four cited audit fixes (eligibility key, queue `timeout`, public→private disk, a TZ decision) into the Phase-1 "foundations" bucket. They are cheap relative to the capabilities that can't safely ship without them.

---

## 4. 🟡 Two assumed data models don't exist

**Multi-legal-entity invoicing.** Guardrail #4 and `AI-083` / the `raise_invoice` tool require resolving "the correct legal entity — EPL, D Immigration or Exalt." **There is no entity/company data model.** Grep finds only a hardcoded *"Exalt Property Management LTD"* string in [`AccommodationController`](../../app/Http/Controllers/AccommodationController.php#L116) flash text. `raise_invoice`'s "resolve entity from the agreement, not from context" cannot be satisfied — there is nothing on the agreement to resolve *from*. **New:** an `entity` concept on programs/cases/tenancies + fee tables per entity.

**Consent / unsubscribe register.** Guardrail #9 (consent hard gate), service #14, and capabilities `AI-028` ("unsubscribe and consent state enforced in query"), `AI-036` ("opt-out"), `AI-031`/`AI-059` ("opt-out honoured / frequency capped"), `AI-032` ("consent gate is a hard block") all assume a suppression register. **It doesn't exist** — no `unsubscribe`/`opt_out`/`suppression` field anywhere; the only consent flag is one accommodation-EOI boolean. Every send-capable capability that claims to honour opt-out is currently claiming enforcement against a column that isn't there. **New, and compliance-relevant:** this should land in Phase 1, not Phase 2 as the workbook has it, because Phase-1 send capabilities (`AI-036`) depend on it.

**Fee table breadth.** Guardrail #4 is already the codebase's pattern for immigration (`consultation_price_nzd` on `VisaType`, `config('services.booking.immigration_fee')` fallback — [`PaymentController.php:37`](../../app/Http/Controllers/PaymentController.php#L37)) — good. But **only immigration/booking fees are a live table.** Education and accommodation fees are not structured, so `AI-035` (Sales proposals), `AI-069` (immigration engagement — OK) and `AI-083` (Finance, all departments) have a fee source for immigration only.

---

## 5. 🟢 What genuinely exists and is reusable

Credit where due — these are real and lower the effort on the capabilities that depend on them:

- **LLM plumbing:** [`CerebrasService`](../../app/Services/CerebrasService.php) (eligibility analysis, disciplined error handling per Bug Audit §1), [`AIService`](../../app/Services/AIService.php), and Gemini via [`ChatController`](../../app/Http/Controllers/ChatController.php). Chat-completion only — no tool-calling/orchestration layer — but the provider integration, keys, and config pattern (`config('services.*')`) are done.
- **Document generation (service #12):** `AgreementGenerator` + dompdf + Blade already render agreements and invoices in-house. `AI-069`/`AI-075`/`generate_document` build on something real.
- **Audit substrate (service #10, partial):** `LogsActivity` on 20 models gives per-record change history — a real foundation for the timeline `AI-002` needs, though the *agent-event* audit (prompts/retrievals/tool-calls) is a separate new store.
- **Agent row-scoping:** `User::agentLeads()` = `hasMany(Lead, 'agent_id')` is genuine row-level scoping for external agents (`AI-092`/`AI-096`). Caveat: **Bug Audit §4** found `agent_id` denormalization drift on event reassignment — the scope broker should filter on it but not trust it as the sole integrity guarantee.
- **n8n wiring & fees** as noted above (partial).

---

## 6. The overview's open questions — what the code can and can't answer

| Open question | What the codebase tells us |
|---|---|
| Model/hosting given **data residency** on client docs | **Already partially violated today, independent of this project.** `CerebrasService` sends assessment data to Cerebras (US API) and `ChatController` to Google Gemini; uploaded docs sit on the public disk. "Region-pinned processing" (Guardrail #8) is a *new* requirement that current features don't meet — worth surfacing as a pre-existing gap, not just a future decision. |
| Memory retention vs **IAA record-keeping** | Can't resolve from code. Note: `LogsActivity` has **no retention/deletion policy** today — whatever you decide has to be built, not configured. |
| Education vs handbook **index sharing** | Guardrail #3 requires the education index to *exclude* INZ material. Given the audits found role scoping is leaky (§1), **storage-layer separation is the safer call than query-filter separation** — a filter bug becomes an advice-boundary breach, which is the one line the spec says must never be crossed. Recommend separate storage. |
| **Override threshold** per level | Governance number; code can't set it. But `AI-018` (usage monitor) — the thing that measures it — has **no telemetry to read yet**; it's net-new (service #10 agent-event store). |

---

## 7. A realistic Phase-1 cut

The spec's Phase 1 is 50 capabilities. That is not the first thing to build; it's the first thing that's *safe* to build once the plumbing lands. Suggested ordering, grounded in the above:

**Phase 0 — prerequisites (mix of new build + audit fixes, no user-visible AI):**
1. **Row-level authorization layer** (service #1, reframed per §1) + retrofit the leaky lead/document endpoints (Sub-Audit 2.5 §4-H5, §1). *This is the gate everything else trusts.*
2. **Tool-execution layer + agent-event audit store** (services #4, #10) — idempotent, reversible, one log per call.
3. **Approval queue** in the Work/Task Board (service #5).
4. **Eval harness** (service #9) — build alongside capability #1, per the overview.
5. **Audit-fix bundle:** eligibility key, queue `timeout` < `retry_after`, docs public→private disk, timezone decision. Cheap; unblocks §3.

**Phase 1a — prove the path (L1, read-only, minimal blast radius):**
- `AI-002` record summary (overview's choice — correct; exercises scope broker + retrieval end-to-end).
- `AI-012`/`AI-066` cited retrieval — **once the RAG index (service #2) exists**; until then these are blocked, so they are *not* the true first capability.

**Phase 1b — the high-value L1/L2 that need only scope + generation (already-real infra):**
- `AI-033` lead scoring, `AI-038`/`AI-043` shortlists, `AI-049` stall detection, `AI-035`/`AI-069` drafting (fees resolve for immigration; add an education/accommodation fee table before `AI-083`).

**Defer until their dependency exists:**
- Anything that **sends** → after the queue fix + consent register (§3, §4).
- Anything OCR/RAG (`AI-006/007/012/044/062/066/098`) → after services #2/#3.
- `AI-083`/`raise_invoice` → after the multi-entity model (§4).
- `AI-015` → after the one-line eligibility fix.

---

## 8. Bottom line

This is a strong, compliance-literate spec — the advice boundary in `01-guardrails.md` genuinely does drive the architecture, exactly as the overview claims. The gap is not in the thinking; it's in **one estimate and a reuse assumption**:

1. **Service #1 is a build, not a mirror.** The row-level scoping the entire safety model depends on does not exist, and the audits proved the per-controller checks that stand in for it are missing on the agent's first targets. This is the thing to get right before anything else, and it's larger than "Effort 3."
2. **~10 of 14 services are net-new**, and **~6 Phase-1 capabilities inherit an existing bug.** Fold the four cheap audit fixes into the foundations phase; they unblock disproportionately.
3. **Two assumed data models (multi-entity, consent) are absent** and gate several named capabilities.

Everything else — the autonomy ladder, the tool registry's rules, the escalation-as-compliance-control design, "the agent never generates a number" — is sound and matches how the codebase already handles fees. Re-score service #1 and the Phase-1 send/OCR/entity capabilities with the dev team, treat the row-level gate as the first deliverable, and the roadmap holds.

---

*Read-only review. No source files modified. Grounded in `full_blown` at 2026-07-21 and the three prior audits in `docs/audits/` (Data+Security, Routes, Bugs).*
