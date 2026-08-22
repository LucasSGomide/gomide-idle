# 02 — The game domain: bounded contexts, modules and aggregates

**Verdict:** viable, not yet spiked · **Opened:** 2026-08-21 · **Closed:** 2026-08-22

> Opened because settling the stack surfaced a question the stack cannot answer.
> [`docs/stack-api.md`](../stack-api.md) kept the `backend-standards` layering
> (aggregates, ports, repository mapping) while
> [`docs/architecture-api.md`](../architecture-api.md) rule 18 pushed simulation
> state the other way, into a plain JSONB blob passed to a pure function. Rule 18
> was a ruling made to unblock the stack docs, not a modelled decision.
>
> **It was replaced, and the replacement is stronger than either side of the
> argument.** Simulation state is not merely "not an aggregate" — it is never
> persisted at all.

## The question

What are the bounded contexts of this game, what modules follow from them, and
which state is an aggregate versus plain simulation data?

## Why it needed an exploration rather than a decision

Three things pulled in different directions and none was obviously wrong: the
`backend-standards` position (aggregates own invariants), the determinism
position (`architecture-api.md` rules 1–5 make combat a pure function over plain
data), and the alpha's actual size (one class, three hunts, six slots, thirty
levels).

The question that dissolved it was not a modelling question. It was: *why is any
of the fight persisted?* Once offline hunting became a mode the player enters
deliberately, the answer was "it isn't", and most of the tension went with it.

## What had to come out of it

- [x] **A context map.** One game language, plus two things that genuinely are
      not: **Identity** (Better Auth — users, sessions, its own tables) and
      **Content** (monsters, hunts, affix tables), which is validated data rather
      than state and is a shared kernel, not a context.
- [x] **A module list.** `apps/api` divides into `character`, `hunt` and `auth`.
      `libs/simulation` and `libs/content` are the only shared packages.
- [x] **The line, as a test.** *Can you recompute it by replaying the current run
      from its header?* Yes → simulation state. No → it is a run input or a
      banked outcome, and belongs to an aggregate. Now
      `architecture-api.md` rule 27.
- [x] **What owns a hunt run.** A `HuntRun` row that is a **header only** —
      character, hunt, seed, content version, start tick, and the frozen
      equipment, skill levels and rule list. It never holds the world. The
      predicted failure point did not occur, because the thing that spanned both
      sides of the line turned out not to exist.
- [x] **Rule 18 is replaced**, not amended. See below.
- [x] **Deferrals**, listed at the end.

## The answers to the open questions

- **Combat is not a bounded context.** It is the most complex code in the repo
  and it speaks the same nouns as the character sheet — skills, stats, forms,
  damage. It is `libs/simulation`, a package, not a language.
- **The rule list is not its own context.** Its vocabulary (rows, conditions,
  priority order) is authored against skills the character owns, and the
  cross-check "every row names a skill you have" only works if both live in one
  object. `component-architecture-2026-08.md` §9.10 enforces the identical rule
  one level down, on content.
- **Items exist in two states, not three.** A roll result the run hands back, and
  an owned thing inside the Character. There is no ground item and no pickup
  phase — `architecture-api.md` rule 26.
- **Content is a shared kernel.** It gets no context and no aggregate. It is
  loaded, validated, frozen, and shared by both apps —
  `stack-api.md` rule 31.
- **The character sheet is `libs/simulation` with zero ticks.** Project the
  Character into a player entity, call `collectModifiers`, run nothing. The sheet
  and the fight are the same code, so they cannot disagree —
  `architecture-api.md` rule 25.

## The model

**One aggregate on the account side: `Character`.** Progression, skill levels,
inventory, the six equipped slots and the rule list. Every invariant in the alpha
— one item per slot, cannot equip what you do not own, skill points ≤ level − 1,
skill level ≤ 10, level ≤ 30, every rule row names a known skill — is checkable in
one place with no cross-object coordination.

This is the research doc's own **one-noun, one-lifetime test**
(`component-architecture-2026-08.md` §5) applied to the account side. Inside a
fight it splits `Health` from `Cooldowns` from `Targeting`, because those are
created and destroyed at different moments. On the account side everything is
created with the character and destroyed with it. Same test, opposite answer, for
a stated reason.

**Split trigger, named now:** when loading a character to spend a skill point
means loading hundreds of items, inventory moves out. It is the only part with an
unbounded growth curve.

**`HuntRun` is a header, never a world.** It is the account side of the line
because its contents are *inputs* — the replay cannot reproduce them, it consumes
them.

**The translation point is a one-way projection.** The Character is projected into
components at run start; the fight mutates them 36,000 times; nothing is written
back. The run returns an outcome and a use case applies it —
`architecture-api.md` rule 24. This is the correction the research doc needs:
§9.2 marks `Equipment`, `Skillbook` and `Gambits` as **saved**, which is written
for a game where the entity *is* the save file. Here the Character is the only
truth, and following §9.2 literally ships two copies of your gear that can
disagree.

## What happened to rule 18

**Replaced.** The old text said simulation state is plain data rather than an
aggregate. The new text says it is never persisted:

> A run's truth is its header — seed, content version, start tick and the frozen
> character snapshot — plus the outcome it banks. The world inside the fight is
> rebuilt by replay and thrown away.

Everything that depended on it moved in the same pass:

| Rule | Was | Now |
| --- | --- | --- |
| `architecture-api.md` 1, 2, 5, 7, 8, 16 | "the saved state", "every existing save" | retargeted to the run header and runs in flight |
| `architecture-api.md` 20–27 | — | appended: sealed sessions, dropped sockets, the frozen header, items by id, one-way projection, the sheet, no ground loot, the test |
| `stack-api.md` 16 | hybrid schema, JSONB blob for simulation state | real columns throughout; JSONB only for the frozen rule list |
| `stack-api.md` 18 | `state_version` is a real column | migrate the run header like any other table |
| `stack-api.md` 19 | migrate saved state lazily on read | never store a fight to resume it; re-run it from its header |
| `stack-api.md` 21 | advisory lock + version CAS | advisory lock + CAS on the run's *status* |
| `naming.md` 4, 5 | — | `libs/simulation` never `libs/sim`; *header* is a reserved word |
| `alpha.md` decision 2 | — | offline hunting is a deliberate mode; nothing about a fight is stored |

## Deferred, and what each assumes

- **Party hunts** (`vision.md`) would make a run belong to several characters, so
  `HuntRun` would stop hanging off one Character and become its own root.
  *Assumes:* one run, one character.
- **Market and trading** would make an item's ownership transferable and give
  Trade its own language. *Assumes:* an item is created inside one Character and
  dies there.
- **Guilds and PvP** are genuinely separate languages and would be genuinely
  separate contexts. Nothing here blocks them; nothing here anticipates them.
- **Death** is still open in `alpha.md`. A run that can terminate early adds an
  outcome kind, not a boundary — so it does not change this model.
- **A second process** (`stack-api.md` rule 24) would make the live hunt's
  in-memory world a routing problem. Sealed offline sessions are unaffected,
  because they hold nothing in memory.

## Findings

Rule 18 was replaced, not defended. The productive question was not "aggregate or
plain data" but "why is any of the fight persisted at all" — and once offline
hunting became a mode the player deliberately enters, sealing gear and rules at
logout, the answer was: it is not. A sealed session replays exactly once, so no
fight state must survive a second resume, and the growing-catch-up problem that
forced a saved world never arises.

That deleted a schema (`stack-api.md` 16), a version column (18) and a lazy
migration scheme (19), and made the aggregate/simulation line a one-line test
instead of a list: *can replaying the current run from its header reproduce it?*

One aggregate — `Character` — because every alpha invariant crosses what the
plausible boundaries would have been. `HuntRun` is a header, never a world.
