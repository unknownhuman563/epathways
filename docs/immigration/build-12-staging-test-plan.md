# Build 12 — Staging test plan (one week of real use)

*Goal: find out whether the build changes behaviour, not just whether it works.
The features pass their automated tests; what we don't know is whether the team
**uses** them or works around them. Run this on staging for a week with real
cases and watch the four things below. Keep a one-line note per day.*

Owner of this check: _______  ·  Week of: _______

---

## The four things to watch

### 1. Do handoffs happen in the app, or still on WhatsApp?

- **Watch:** when a case actually changes hands, does someone use the **Handoff**
  button (the new owner gets an app + email notification), or does the case just
  quietly change who's working it while the board still shows the old owner?
- **How to tell:** at the end of the week, compare the cases whose owner changed
  in the app against the handovers you know happened in real life.
- **Good signal:** most real handovers show up as in-app handoffs, with notes.
- **Failure signal:** the board owner is stale and everyone still coordinates on
  WhatsApp — the board isn't trusted yet. Note *why* (too slow? too many clicks?
  notification not seen?).

### 2. Do the QC stamps at steps 03, 08, 10 get used or worked around?

- **Watch:** Rhandel's QC points. Does the QC step get a **Pass / Fail** stamp, or
  does the case move past it without one (or the step gets marked done without a
  real check)?
- **How to tell:** on cases that reached those steps, look at whether 03 / 08 / 10
  carry a QC result.
- **Good signal:** QC steps are stamped as they happen.
- **Failure signal:** steps advance with no QC stamp, or Rhandel finds the stamp
  gets in the way and skips it. Note whether step 08 (first-5-cases audit) fired on
  the cases you'd expect and *not* on experienced advisers' later cases.

### 3. What's the findings count on a genuinely messy case?

- **Watch:** pick one or two **real, messy** cases (lots outstanding), open the AI
  Health panel, and count the rows after grouping.
- **How to tell:** the checklist items should collapse into one summary line; the
  panel should read in **single digits** of rows, not a wall.
- **Good signal:** a messy case shows a handful of readable, distinct items and
  staff actually read them.
- **Failure signal:** still a wall of rows, or the opposite — grouping hides
  something that needed to stand out. Note the count and which rule dominated; the
  collapse threshold and the individual thresholds are both tunable.

### 4. Does the step chain get started on new cases at all?

- **Watch:** the single biggest adoption question. On cases created during the
  week, does anyone press **Start process tracking**?
- **How to tell:** count new immigration cases for the week vs. how many have a
  step chain started.
- **Good signal:** new cases get put on the chain as a matter of course.
- **Failure signal:** almost no new case gets a chain — the panel is being
  ignored. Note the reason (unclear value? extra step? nobody owns starting it?).

---

## Also worth a glance

- **Attention chip accuracy:** does "Opened {date}" match reality — did Henry
  actually open the ones it says were opened, and do the "Not opened" ones feel
  right?
- **Threads:** do questions get **answered and resolved**, or do they pile up
  unresolved? An unanswered thread should turn into an AI Health item after a few
  days — check that it does and that resolving it clears it.
- **Verdicts:** does Henry record a verdict where one is due, and does *Good to go*
  actually advance the case / *Needs something* actually send it back?
- **Lodgement sign-off:** confirm a case can't complete step 12 on the upload
  alone — the sign-off is required and it's the adviser's.
- **Stage control:** moving the stage from the board should move the case along the
  chain; check the board and the Process panel agree afterwards.

## What to write down each day

One line: *date · what you watched · did it happen in the app or around it · any
friction.* At the end of the week, that log is the input to tuning thresholds and
deciding what (if anything) blocks the production push.
