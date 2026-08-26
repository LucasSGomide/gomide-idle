# Goal: Reorganize the architecture, design and process docs

Split every rule in `docs/architecture-web.md`, `docs/architecture-api.md` and
`docs/design.md` into what it actually is, keep only true architecture
principles in the architecture docs, turn `docs/design.md` into a UI/UX-only
doc, and retire `docs/process.md` entirely.

**Status:** executed 2026-08-23 — rules reclassified, `docs/design.md` narrowed to UI/UX, `docs/process.md` retired
**Rating:** —
**Run:** one sitting — step 2 depends on step 1's classification, which is never written down

## Context

`docs/architecture-web.md` and `docs/architecture-api.md` are supposed to hold
core architecture principles — folder structure, the dependency rule between
layers, examples of how layers should interact. Instead they mostly hold rules
that are really functional requirements or user needs about the game itself
(e.g. "cap how much elapsed time a single catch-up will replay", "never send
RNG state to the client") that haven't been formally derived from
[`alpha.md`](../../alpha.md) yet. `docs/design.md` has the same problem in the
other direction: it's supposed to be UI/UX guidelines, but every rule in it is
actually game-balance/economy tuning advice.

This is a two-step job. Do them in order, in one sitting, because step 2
depends on step 1's classification and nothing from step 1 is written down
anywhere.

**Step 1 — establish the categories.** Before touching any rule, work out and
state (inline, in your own reasoning — this is not a file to create) a clear
one-line test for each of these four buckets, each with one example pulled
from the current docs:

- **Architecture principle** — constrains code structure, dependency
  direction, or how layers/modules talk to each other. Stays in the
  architecture docs. Example: "`libs/simulation` depends on nothing" or "the
  renderer owns one element and React never renders inside it."
- **Functional requirement** — a specific, testable behavior the game/system
  must have. Example: "cap how much elapsed time a single catch-up will
  replay."
- **User need** — the underlying player- or operator-facing motivation behind
  a requirement, if the rule states or implies one. Example: a player
  returning after months away should not have their login hang.
- **Note** — doesn't fit either of the above but the reasoning shouldn't be
  lost (e.g. a tuning heuristic, a historical "we tried X and it broke").

**Step 2 — apply it.** Sort every rule in all three docs into one of the four
buckets and move it to the right place, per the constraints below.

## Constraints

1. An architecture principle stays in `docs/architecture-web.md` or
   `docs/architecture-api.md` (whichever it already belongs to). Everything
   else — functional requirement, user need, or note — gets moved out.
2. Drop the numbered "one imperative + one line of why" template these two
   docs currently use. Whatever architecture content remains becomes plain
   prose, grouped under topic headings (e.g. "Dependency direction", "Renderer
   boundary", "Determinism"). No numbering.
3. Add three new tables to `alpha.md`: **Functional Requirements**, **User
   Needs**, and **Notes**. Move every extracted rule from
   `architecture-web.md` and `architecture-api.md` into the matching table.
   This includes all of `docs/design.md`'s current content (its game-balance
   and economy rules are functional requirements/notes, not UI/UX
   guidelines) — sort those into the same three tables.
4. These alpha.md tables are an informal staging area. Do not touch
   `docs/requirements.md` — that's the project's separate, formal,
   append-only requirements log populated later by the `msg-pre-roadmap`
   skill. This prompt does not run that skill and does not write to that
   file.
5. `docs/design.md` ends up with no content of its own yet (everything it had
   was game-balance, not UI/UX). Leave it with just a short purpose
   statement — "UI/UX guidelines for the game's interface" or similar — no
   numbered template, ready for real rules once they exist.
6. Delete `docs/process.md` outright. Nothing in it gets migrated anywhere —
   the project isn't using a process doc.
7. Update `project.yml`: remove the `Process` row from the `areas` table
   entirely.
8. Every rule you move or renumber may be cited elsewhere. Search
   `docs/explorations/02-domain-model.md`, `docs/explorations/03-colyseus-spike.md`,
   and `docs/explorations/04-the-live-hunt.md` for citations like
   `architecture-api.md rule N` or `architecture-web.md rule N`, and update
   each one to point at the rule's new location — either its new spot in the
   prose (drop the "rule N" framing since there's no numbering left), or the
   matching row you created in `alpha.md`.
9. Finish by running `make roadmap-sync` and `make roadmap-check`. Fix
   whatever either one flags before considering this done.

## Output

Edit the repo files directly: `docs/architecture-web.md`,
`docs/architecture-api.md`, `docs/design.md`, `alpha.md`, `project.yml`
(edited), `docs/process.md` (deleted), and the three exploration docs'
citations (edited). No separate summary, changelog, or new doc — report back
in chat when the docs are correct and `make roadmap-check` passes clean.
