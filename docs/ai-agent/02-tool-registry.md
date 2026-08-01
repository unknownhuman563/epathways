# Agent Tool Registry

> Draft specification for the functions the agent runtime exposes.
> Read tools are safe to expose broadly. Write tools carry an approval requirement and an audit entry.

## Rules for every tool

- **Scoped.** Every tool receives the caller's resolved scope filter. A tool cannot widen it.
- **Idempotent.** Re-invocation with the same arguments must not double-write.
- **Reversible.** Any write must be undoable, and the undo path must be tested.
- **Audited.** One log entry per call: caller, arguments, result, approval reference.
- **Policied.** Tools call the same server-side endpoints the UI calls. No privileged bypass exists.

## Read tools

| Tool | Purpose | Key parameters | Returns | Permitted roles |
|---|---|---|---|---|
| `search_records` | Scoped search across leads, students, cases, tenancies | `entity, query, filters, limit` | Record stubs the caller may open | All staff, scoped |
| `get_record` | Full record with timeline and linked documents | `entity, id` | Record + activity | All staff, scoped |
| `get_checklist_status` | Outstanding checklist items for a student or case | `student_id or case_id` | Items with status and due date | Education, Immigration, Lead, Agent |
| `search_programs` | Program and school catalogue query | `level, field, budget, intake, city` | Ranked programs with entry criteria | Sales, Education, Agent |
| `kb_search` | RAG over the audience-appropriate knowledge base | `index, query, top_k` | Passages with citation and effective date | Per index |
| `inz_instruction_lookup` | INZ operational manual retrieval | `topic, visa_category` | Instruction text, number, effective date | Immigration only |
| `extract_document` | OCR and structured extraction on a stored file | `document_id, expected_type` | Fields + confidence + page refs | Staff |
| `check_document_quality` | Legibility, completeness, expiry and type check | `document_id` | Pass / fix list | All including Lead |
| `get_ledger_summary` | Invoices, payments and balance for a client | `client_id` | Ledger lines | Finance, Admin, Lead (own) |
| `get_availability` | Free slots across consultant or PM calendars | `team, date_range, duration` | Slots in the caller's time zone | All |

## Write tools

| Tool | Purpose | Key parameters | Returns | Permitted roles | Approval |
|---|---|---|---|---|---|
| `create_lead` | Create a lead from a qualified conversation | `contact, source, interest, consent` | lead_id | Sales, Agent, Pathy | No |
| `update_record_fields` | Apply proposed field values to a record | `entity, id, field_map, source_ref` | Diff applied | Staff, scoped | Yes |
| `create_task` | Raise a task on the department board | `owner, title, due, linked_record` | task_id | All staff | No |
| `draft_message` | Produce a draft email or SMS in the record thread | `record_id, template_id, context` | draft_id | All staff | Draft only |
| `send_message` | Send an approved message on an approved channel | `draft_id, channel` | message_id | Staff | Yes |
| `generate_document` | Render a proposal, agreement, invoice or report | `template, entity, data` | file_id | Staff | Yes |
| `book_appointment` | Create a booking and issue confirmations | `slot, attendees, type` | booking_id | Sales, Lead, Accommodation | Configurable |
| `queue_for_approval` | Park a proposed action in the human queue | `action, payload, rationale` | approval_id | System | n/a |
| `escalate_to_human` | Hand a conversation to a named staff member | `thread_id, reason, urgency` | ticket_id | All agents | No |
| `log_file_note` | Write a contemporaneous file note to a case | `case_id, note, participants` | note_id | Immigration | Yes — LIA |
| `raise_invoice` | Generate an invoice against an agreement milestone | `agreement_id, milestone, entity` | invoice_id | Finance | Yes |
| `dispatch_maintenance` | Raise a maintenance job with a vendor | `property_id, issue, urgency` | job_id | Accommodation | Yes |
| `schedule_post` | Queue a social post to the calendar | `channel, content, time` | post_id | Admin Social | Yes |

## Notes on specific tools

- **`escalate_to_human`** is the compliance control for every client-facing surface. It must route to
  a *named* person, not a queue, and every invocation is logged for weekly review. Tune the
  classifier that fires it for false positives, not false negatives.
- **`log_file_note`** exists to satisfy the contemporaneous file-note obligation. The adviser must
  verify accuracy before the note is filed; the agent's draft is never the record of itself.
- **`update_record_fields`** requires a `source_ref` — the document and page an extracted value came
  from. A field written without provenance is not acceptable.
- **`generate_document`** resolves fees from the live fee table by tool call. The model is not
  permitted to emit currency amounts from its own text.
- **`raise_invoice`** must resolve the correct legal entity (Employment Pathways Limited,
  D Immigration Consultancy Limited, or Exalt Property Management) from the agreement, not from
  context. **Note: no legal-entity data model exists yet** — today the entity is a hardcoded string
  in a controller (Phase 0 item 10).
