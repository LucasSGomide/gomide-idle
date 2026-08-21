# Goal: Run exploration 02 to a verdict — the game's bounded contexts, modules, and the line between aggregate state and simulation state

**Status:** not yet executed
**Rating:** —
**Run:** standalone — can run before or after the exploration 03 Colyseus spike

## Context

[`docs/explorations/02-domain-model.md`](../explorations/02-domain-model.md) was
opened on 2026-08-21, at the end of the session that settled the tech stack. It
exists because settling the stack surfaced a question the stack could not answer.

The `backend-standards` skill says domain aggregates are plain TypeScript classes
owning their invariants, with a separate decorated persistence entity and a
repository doing `fromPersistenceToDomain` / `fromDomainToPersistence`. That is
the shape every other project of ours uses.

[`docs/architecture-api.md`](../architecture-api.md) pulls the other way for the
simulation: rules 1–5 make it a pure function over plain data with an empty
dependency list, replaying hundreds of thousands of ticks per catch-up, and rule
18 says simulation state is plain data and never an aggregate.

**Rule 18 was a ruling made to unblock the stack docs, not a modelled decision.**
It was written by an agent, accepted by nobody, and it is load-bearing: the
persistence design in [`docs/stack-api.md`](../stack-api.md) rules 16–21 — the
hybrid schema, the JSONB blob, lazy state migration — all assume it holds. This
exploration is where it gets modelled properly, and it may be overturned.

The exploration doc already lists six deliverables and five questions to grill.
Read it first; it is the specification for this work, and it should be updated in
place rather than replaced.

The likely failure point is already identified: **the hunt run**. It spans both
sides of the line — it holds the seed and content version (account-shaped,
queried, a real row) while being the thing the simulation actually operates on.
If the ruling breaks anywhere, it breaks there.

## Constraints

1. Grill before writing. The user needs to *visualize* the domain, not receive a
   finished model — walk the contexts with them rather than presenting a map.
   `msg-roadmap-plan-item` is the skill that takes an exploration to a verdict.
2. Model the alpha in [`alpha.md`](../../alpha.md), not the game in
   [`vision.md`](../../vision.md). One class, three hunts, six item slots, thirty
   levels. `docs/design.md` rule 2 — complexity lives in one system at a time.
   Where a `vision.md` feature (guilds, market, PvP, party hunts) would change a
   boundary, note the assumption and defer it explicitly rather than modelling it.
3. State the aggregate-versus-simulation-state line as a **test that can be
   applied to a new piece of state**, not as a list of what goes where. A list
   goes stale the first time a mechanic is added.
4. Reach a verdict. The exploration's `## Findings` section must be written, and
   its Verdict must move off `open, not yet researched` to one of the values in
   `docs/explorations/README.md`.
5. Say explicitly what happens to `architecture-api.md` rule 18 — survives,
   amended, or replaced — and if it changes, update the rule and every
   `stack-api.md` rule that depends on it in the same pass.
6. Do not begin implementation. This produces a model and rules, not code, and
   nothing here is a roadmap item yet.
7. Run `make roadmap-sync` after changing a Verdict, then `make roadmap-check`.
8. Create a session branch before touching planning files — the `PreToolUse` hook
   in `.claude/settings.json` enforces it.

## Tone

Direct and concrete. Explain trade-offs in plain language with worked examples
before asking the user to choose between them — terse option cards full of DDD
jargon get rejected. Lead with a recommendation, but make the reasoning visible
enough that the user can disagree with it.

## Output

An updated `docs/explorations/02-domain-model.md` — every checkbox resolved, a
written `## Findings` section, and a Verdict. Plus, if the model changes them,
edits to `docs/architecture-api.md`, `docs/stack-api.md` and `docs/naming.md`.
