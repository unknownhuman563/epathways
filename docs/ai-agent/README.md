# ePathways AI Agent — specification pack

```
docs/ai-agent/
├── 00-overview.md        architecture, autonomy ladder, core services, build order
├── 01-guardrails.md      compliance constraints — read first
├── 02-tool-registry.md   function specs for the agent runtime
├── 03-capabilities.md    105 capabilities, indexed and detailed by portal
├── 04-phase-0.md         prerequisites — what must land before any capability ships
└── FEASIBILITY_REVIEW.md the raw read-only review 04-phase-0 was distilled from
```

**Read `04-phase-0.md` before anything else.** Two items in it are live production issues that exist
independently of this project, and one is a correction to the architecture: the scope broker is a
build, not a mirror of existing middleware.

Work one capability per session. Skip anything marked BLOCKED in `03-capabilities.md` until its
prerequisite lands.

The standing constraints for this layer are pasted into the project `CLAUDE.md` (section
"AI Agent layer — standing constraints"), so they load every session whether or not anyone
references this pack.

Revised 28 Jul 2026 after a read-only feasibility review against branch `full_blown`. Value and
Effort remain an outside-in estimate; every capability marked RE-SCORE priced integration effort
against a core service that turns out to be net-new.
