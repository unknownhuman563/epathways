# Build 12 — What's new for the immigration team

*For Emma, Rhandel and Henry. This is a plain summary of what changed on screen —
no technical detail. If anything here doesn't match what you see, tell us; that's
exactly what the staging week is for.*

The theme of this build: **the case record now shows who holds a case, whether
the adviser has looked, what the adviser decided, and what's still outstanding —
inside the system, instead of on WhatsApp.**

---

## On the Cases board

- **My queue now means "yours to act on", not just "yours to own".** A case shows
  up in your queue if you own it **or** someone has put a question to you on it. A
  small **"asks"** badge on the row tells you how many open questions are waiting
  for your answer.
- **You can see whether an adviser has opened a case, and when.** Each row shows
  **"Opened {date}"** or **"Not opened"**. This is drawn only from a licensed
  adviser opening the case — so it answers "has Henry looked at this yet?" It does
  **not** track how long anyone spent; only whether and when.
- **Handoffs happen in the app.** Handing a case to a colleague (or claiming one)
  sends them a notification by app and email, carries your note, and links
  straight to the case. The board is meant to be the source of truth for "who has
  this now".
- The board no longer silently hides older cases behind a row limit; if the list
  is capped you'll see a banner saying so.

## The Process panel (new)

Each case can be tracked against the department's **16-step process** — the same
steps you already run, now written down per case with owners, deadlines and gates.

- **Start tracking** on a case and the steps appear with their owner and, where
  there's a deadline, a due date. Deadlines are counted in **working days** (so a
  Friday 48-hour clock doesn't read as overdue on Monday).
- **QC steps (03, 08, 10)** carry a **Pass / Fail** stamp. QC is procedural — "are
  the fields filled, is the trail complete, do the two lines match" — and is **not**
  treated as advice.
- **Payment (step 11)** runs alongside the document steps, and lodgement (step 12)
  can't be reached until payment is recorded.
- **Partner-visa cases** show a fork before the agreement: the adviser recommends
  the main applicant, and the client's written choice is attached before step 06.
- If INZ comes back with a request, you can **re-open a step**; it starts a fresh
  attempt with a fresh deadline rather than losing the history.
- Step 07 (video/booking/signature) appears as a **marker** for now — it records
  that the point was reached, but does not block on a checkbox.

## The AI Health panel (new)

A set of **automatic checks** on each case — missing documents, rejected
documents, a passport nearing expiry, an unpaid invoice past due, an overdue step,
an unanswered question, and so on.

- It's **indicative and internal** — a prompt to look, never advice and never
  shown to clients.
- A long list of the **same kind** of issue collapses into **one summary line**
  ("18 checklist items outstanding") that you can expand, with a **single action**
  and a **single dismiss** for the whole group.
- Every dismissal needs a **reason**, and there's a **"Couldn't verify"** line so
  the panel never reads as "all clear" when it just means "nothing found in what I
  could check".

## What changed about stage moves

The inline **stage control on a case now advances the process chain** rather than
just writing a stage. The step chain is the single source of truth for where a
case is, and the board reads from it — so the two can't disagree. Cases that
aren't on the chain yet keep behaving exactly as before until you start tracking
them.

## What advisers can now do

Henry (and any licensed adviser) previously had a read-only view. That's reversed:

- **Full write on the case**, like the rest of the team.
- **Record a verdict** — *Good to go* / *Needs something* / *Cannot endorse* (the
  last two need a reason). *Good to go* advances the case; *Needs something* sends
  it back to a named step; *Cannot endorse* holds it and raises a flag.
- **Sign off lodgement.** Step 12 now completes on the **adviser's sign-off**, not
  on the upload alone — the developer can do the mechanical upload, but the case
  isn't "lodged" until the adviser signs it off.
- **Recommend the main applicant** on a partner-visa case.
- Questions addressed to the adviser show up in the adviser's queue like anything
  else.

These adviser actions are tied to a **current licence**: if a licence lapses, the
controls close automatically. That's by design — only a licensed adviser may put
their name to advice.
