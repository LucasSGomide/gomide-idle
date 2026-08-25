# 02 — The game domain: bounded contexts, modules and aggregates

**Verdict:** viable, not yet spiked · **Opened:** 2026-08-21 · **Closed:** 2026-08-22

> Opened because settling the stack surfaced a question the stack cannot answer.
> [`docs/stack-api.md`](../stack-api.md) kept the `backend-standards` layering
> (aggregates, ports, repository mapping) while
> [`docs/architecture-api.md`](../architecture-api.md)'s simulation-boundary
> rule (simulation state is plain data, never persisted) pushed simulation
> state the other way, into a plain JSONB blob passed to a pure function. That
> rule was a ruling made to unblock the stack docs, not a modelled decision.
>
> **It was replaced, and the replacement is stronger than either side of the
> argument.** Simulation state is not merely "not an aggregate" — it is never
> persisted at all.

> **Amended 2026-08-24 by the alpha scope audit.** One invariant below is now
> wrong. *"skill points ≤ level − 1"* became **skill points = level**: a character
> gets their first point at level 1, and skill points now both *unlock* a skill and
> raise it. `Character` also stops being one-per-account — an account holds several,
> though at most one may be sealed offline at a time. Neither changes the model: the
> invariants still all cross the same aggregate. See [`alpha.md`](../../alpha.md)
> § Progression and § Account and characters.

> **Amended 2026-08-23 by [04](04-the-live-hunt.md).** Three things moved. A live
> fight is now continuously edited, so a run's inputs are no longer frozen at
> start — freezing is offline's property alone. An **arena** appeared underneath
> the run: an in-memory room, holding several players, with its own lifetime and
> its own wave counter, which this exploration never modelled because nothing then
> outlived a single player's run. And *"party hunts would make a run belong to
> several characters"* is answered: a **Run stays per-player**, and it is the
> arena that is shared. The findings below hold otherwise.

## The question

What are the bounded contexts of this game, what modules follow from them, and
which state is an aggregate versus plain simulation data?

## Why it needed an exploration rather than a decision

Three things pulled in different directions and none was obviously wrong: the
`backend-standards` position (aggregates own invariants), the determinism
position (`architecture-api.md`'s determinism rules make combat a pure
function over plain data), and the alpha's actual size (one class, three
hunts, six slots, thirty levels).

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
      `architecture-api.md`'s simulation-boundary section.
- [x] **What owns a hunt run.** A `HuntRun` row that is a **header only** —
      character, hunt, seed, content version, start tick, and the frozen
      equipment, skill levels and rule list. It never holds the world. The
      predicted failure point did not occur, because the thing that spanned both
      sides of the line turned out not to exist.
- [x] **The "simulation state is never persisted" rule is replaced**, not
      amended. See below.
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
  phase — `alpha.md`'s Functional Requirements table (loot resolves straight
  into the inventory).
- **Content is a shared kernel.** It gets no context and no aggregate. It is
  loaded, validated, frozen, and shared by both apps —
  `stack-api.md` rule 31.
- **The character sheet is `libs/simulation` with zero ticks.** Project the
  Character into a player entity, call `collectModifiers`, run nothing. The sheet
  and the fight are the same code, so they cannot disagree —
  `architecture-api.md`'s simulation-boundary section (the character sheet is
  the simulation's modifier collection run with zero ticks).

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
`architecture-api.md`'s simulation-boundary section (project the character
into the fight, never write the fight back). This is the correction the
research doc needs:
§9.2 marks `Equipment`, `Skillbook` and `Gambits` as **saved**, which is written
for a game where the entity *is* the save file. Here the Character is the only
truth, and following §9.2 literally ships two copies of your gear that can
disagree.

## What happened to the "simulation state is never persisted" rule

**Replaced.** The old text said simulation state is plain data rather than an
aggregate. The new text says it is never persisted:

> A run's truth is its header — seed, content version, start tick and the frozen
> character snapshot — plus the outcome it banks. The world inside the fight is
> rebuilt by replay and thrown away.

Everything that depended on it moved in the same pass:

| Doc | Was | Now |
| --- | --- | --- |
| `architecture-api.md`'s determinism and server-authority rules (RNG seed/counter, PRNG algorithm pinning, fixed-point integers, migration-commit timing, separate PRNG streams) | "the saved state", "every existing save" | retargeted to the run header and runs in flight |
| `architecture-api.md`'s simulation boundary, plus `alpha.md`'s Functional Requirements | — | appended: sealed sessions, dropped sockets, the frozen header, items by id, one-way projection, the sheet, no ground loot, the replay test |
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

The "simulation state is never persisted" rule was replaced, not defended. The productive question was not "aggregate or
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
