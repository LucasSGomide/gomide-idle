# 02 — The game domain: bounded contexts, modules and aggregates

**Verdict:** open, not yet researched · **Opened:** 2026-08-21

> Opened because settling the stack surfaced a question the stack cannot answer.
> [`docs/stack-api.md`](../stack-api.md) kept the `backend-standards` layering
> (aggregates, ports, repository mapping) while
> [`docs/architecture-api.md`](../architecture-api.md) rule 18 pushed simulation
> state the other way, into a plain JSONB blob passed to a pure function. Rule 18
> is a ruling made to unblock the stack docs, not a modelled decision. This
> exploration is where it gets modelled — or overturned.

## The question

What are the bounded contexts of this game, what modules follow from them, and
which state is an aggregate versus plain simulation data?

## Why it needs an exploration rather than a decision

Three things pull in different directions and none of them is obviously wrong.

1. **The `backend-standards` position.** Domain aggregates are plain TypeScript
   classes that own their invariants; a separate persistence entity carries the
   ORM decorators; the repository is the only thing crossing between them. This
   is the shape every other project of ours uses, and its payoff is that
   invariants live in one place.

2. **The determinism position.** `architecture-api.md` rules 1–5 make the
   simulation a pure function over plain data, with an empty dependency list,
   replaying hundreds of thousands of ticks per catch-up. Aggregates with
   methods, identity and lifecycle are the wrong shape for that hot path — and
   the wrong shape to serialize into a versioned save blob.

3. **The alpha's actual size.** One class, three hunts, six item slots, thirty
   levels. A context map drawn for the game in [`vision.md`](../../vision.md) —
   guilds, market, PvP, party hunts — would be a map of a game that does not
   exist yet, and `design.md` rule 2 says complexity lives in one system at a
   time.

## What has to come out of it

- [ ] A context map: which parts of the game are genuinely separate languages,
      and where the translation points are.
- [ ] A module list for `apps/api`, and whether `libs/sim` and `libs/content`
      are the only shared packages.
- [ ] The line between aggregate-shaped state and simulation-shaped state, stated
      as a test that can be applied to a new piece of state rather than as a list.
- [ ] What owns a hunt run — it spans both sides of that line, holds the seed and
      the content version, and is the most likely place the ruling breaks.
- [ ] Whether `architecture-api.md` rule 18 survives, is amended, or is replaced.
- [ ] Which of the above is deferred until `vision.md` features are actually
      scheduled, and what each deferral assumes.

## Open questions to grill

- Is "combat" a bounded context, or is it a *service* inside the character
  context that happens to be the most complex code in the repo?
- Does the priority list belong to the character, or is authoring behaviour its
  own context with its own language (rules, conditions, vocabulary)?
- Items exist in three states — rolled by the simulation, stored in an inventory,
  equipped and contributing modifiers. Is that one aggregate or three?
- Content (monsters, hunts, affix tables) is validated data, not state. Does it
  get a context at all, or is it a shared kernel?
- Where does the character sheet's "explain every modifier's source" requirement
  live? It is a read model, and it is the one place the sim's internals must
  become presentable.

## Findings

<!-- Nothing yet. This section is written when the exploration closes. -->
