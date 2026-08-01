# Guardrails & Compliance

> **Read this before scoping or building any AI capability in this system.**
> These are constraints on the design, not warnings to keep in mind.

## The one hard rule

No AI surface in this system gives immigration advice.

Under the Immigration Advisers Licensing Act 2007 only a licensed adviser may do that, and *"the
chatbot said so"* is not a defence — it is the licence holder who carries the exposure. Every
immigration-flavoured output in this system is internal, indicative, and drafted **for** the
Licensed Immigration Adviser to review, adopt and sign. Client-facing agents state status and
process only, and escalate anything that resembles advice.

This is why several high-value capabilities are deliberately capped at L1/L2. Those caps are not
conservatism to be optimised away later.

## Rules

### 1. Immigration advice

**Rule.** No AI surface provides immigration advice to a client, an agent or a prospect. Only the licensed adviser does that.

**Enforcement.** Client-facing agents run on a restricted knowledge index with an escalation classifier in front. Advisory outputs exist only inside the Immigration portal, labelled internal, unsigned until the LIA adopts them.

**Owner:** Hendry Dai (LIA)

### 2. Adviser authorship

**Rule.** A draft prepared by the agent is scaffolding. The adviser rewrites, verifies and signs — and is the author of record.

**Enforcement.** PPI responses, file notes and form pre-fills are locked in draft state; adoption requires an explicit LIA action that is logged.

**Owner:** Hendry Dai (LIA)

### 3. Education vs immigration line

**Rule.** Education staff and the education agent discuss study options. They do not opine on visa prospects, however the question is phrased.

**Enforcement.** The education knowledge index excludes INZ instruction material. Visa questions route to the immigration queue.

**Owner:** Emma Ceballo

### 4. Fees and prices

**Rule.** The agent never generates a number. It reads the live fee table or it says it does not know.

**Enforcement.** Fee fields resolved by tool call only; the model is not permitted to emit currency amounts from its own text.

**Owner:** Finance

### 5. Row-level scoping

**Rule.** The agent can only see what the signed-in user could open unaided. Agents and Leads see their own records, full stop.

**Enforcement.** Scope filter injected before retrieval. **`EnsurePortalAccess` does not provide this** — it is role-level, not row-level. The scope broker is a new authorization layer that injects the ownership/department predicate itself, and does not delegate scoping to endpoints (several controllers were audited and found to have no record-level check). Tested as a security control, not a feature. See `04-phase-0.md`.

**Owner:** Dev / Engineering

### 6. Admin blast radius

**Rule.** Admins pass every portal check, so an agent acting for an admin can reach everything. Treat admin-context tool calls as privileged.

**Enforcement.** Write tools called in an admin session require approval regardless of the capability's normal autonomy level.

**Owner:** Super Admin

### 7. Read-only roles

**Rule.** immigration_adviser is read-only by design. The agent must not become a write path around that.

**Enforcement.** Enforcement stays in the server-side policy layer. The agent calls the same policied endpoints as the UI — no privileged bypass.

**Owner:** Dev / Engineering

### 8. Privacy & data residency

**Rule.** Client documents contain passports, financials and medical material. Handle accordingly.

**Enforcement.** No training on client data; region-pinned processing; retention and deletion honoured through the agent's memory store as well as the database. **Note: not met today** — assessment data already reaches Cerebras and Gemini, and documents sit on a world-readable disk (see `04-phase-0.md` items 1–2).

**Owner:** Dev / Engineering

### 9. Consent before publication

**Rule.** No client name, photo, story or outcome is used in marketing without recorded written consent.

**Enforcement.** Consent register is a hard gate in the publish path. Absent a consent record, the tool call fails. **Note: the register does not exist yet** (Phase 0 item 5).

**Owner:** Marketing / Admin

### 10. No fabricated facts

**Rule.** The agent may only assert what is in the record or a cited source. Empty field means 'unknown', never a plausible guess.

**Enforcement.** Retrieval-grounded prompting, refusal when no source is retrieved, and an eval set specifically targeting hallucinated client details.

**Owner:** Dev / Engineering

### 11. Auditability

**Rule.** Every prompt, retrieval, tool call, approval and override is logged and attributable.

**Enforcement.** Observability layer, retained for the period the IAA record-keeping obligations require. `LogsActivity` covers model-attribute changes, not agent events — the agent-event store is separate (Phase 0 item 7).

**Owner:** Super Admin

### 12. Escalation is logged

**Rule.** Every escalation and every refusal is reviewed weekly. Both are signal, not noise.

**Enforcement.** Escalation events feed a governance dashboard; refusal spikes indicate a knowledge gap, escalation spikes indicate a scoping error.

**Owner:** Dinah Suarin / Dev

### 13. Human override rate

**Rule.** If humans override an agent's output more than a set threshold, autonomy is rolled back a level automatically.

**Enforcement.** Tracked per capability in the AI usage monitor. A published threshold beats a judgement call under deadline pressure.

**Owner:** Governance

### 14. Disclosure

**Rule.** Clients and agents are told when they are talking to an AI assistant and how to reach a person.

**Enforcement.** Persistent label in the chat surface plus a one-tap 'talk to a human' control.

**Owner:** Product

### 15. Vulnerable users

**Rule.** Distress, coercion, or a client acting against their own interest goes to a human immediately, without a scripted reply.

**Enforcement.** Distress detection in the escalation classifier, routed to a named person rather than a queue.

**Owner:** Dinah Suarin

### 16. Tenancy & consumer law

**Rule.** Accommodation output must satisfy the Residential Tenancies Act; formal notices are never sent by an agent.

**Enforcement.** Notice templates are draft-only with mandatory human dispatch.

**Owner:** Exalt PM

---

## Capabilities carrying a critical compliance flag

These require sign-off from the named owner before work starts.

| ID | Portal | Capability | Flag |
|---|---|---|---|
| `AI-061` | Immigration | Indicative eligibility pre-assessment | internal only. Not advice until the LIA adopts it. |
| `AI-064` | Immigration | PPI / RFI response drafting | the adviser is the author. Draft is scaffolding only. |
| `AI-068` | Immigration | Client status updates | status only, strictly no advisory content |
| `AI-094` | Agent (external) | Indicative fit check | screening only; heavy disclaimer; no immigration outcome implied |
| `AI-102` | Lead (client) | Front-line FAQ agent with hard escalation | the escalation classifier is the compliance control. Log every escalation. |

## Review cadence

- **Weekly** — escalation and refusal logs. Both are signal. A refusal spike means a knowledge gap;
  an escalation spike means a scoping error.
- **Monthly** — human override rate per capability against the published threshold.
- **Quarterly** — access and permission review; knowledge index freshness, particularly INZ
  instructions and provider entry criteria.
