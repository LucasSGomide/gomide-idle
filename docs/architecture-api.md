# Back-end rules

Rules for anything back-end-shaped. `project.yml` points every
`**Back-end**` bullet in a roadmap item at this file.

These are architecture principles only — constraints on code structure and
dependency direction, and on how the simulation, the server and the client are
allowed to talk to each other. Functional requirements, user needs and tuning
notes that used to live here have moved to [`alpha.md`](../alpha.md)'s
Functional Requirements, User Needs and Notes tables.

The simulation lives here. Most of what follows exists because
[`alpha.md`](../alpha.md) decision 2 makes offline progress a **replay** of the
live combat code — which turns determinism from a nice property into a
correctness requirement.

## Determinism

Never call `Math.random()` inside the simulation. Use one seeded PRNG whose
seed *and call counter* live in the run state.

Pin the PRNG algorithm in your own code, not in a dependency. A library that
changes its generator in a minor version silently changes the outcome of every
run in flight.

Never read the clock inside the simulation. Time is a parameter passed in.

Sort by stable entity id before any loop whose order affects the outcome.
Objects and Maps preserve insertion order, but a state rebuilt from JSON
iterates differently.

Store damage, health and every combat quantity as fixed-point integers, never
floating point. Floating point is deterministic on one machine but drifts
between engines.

Use separate PRNG streams for combat and for loot. One shared stream means
adding a single roll to any mechanic silently rerolls every future drop in
every run in flight.

## Server authority

The server owns state, the clock and the seed; the client sends intent.
[`alpha.md`](../alpha.md) decision 4 depends on this.

Never send RNG state to the client. The seed determines every future drop.

`libs/simulation` depends on nothing. An empty dependency list is the only
enforcement of the determinism rules above that cannot be forgotten in review.

The simulation refers to items by id, never by an item object. It keeps the
fight independent of every account-side shape.

Content is data, validated at load — never constants in code. A new monster,
item or hunt should be a content edit; only a new *dimension* should be a code
change.

## Simulation boundary

The simulation has no side effects until one transactional write at the end.
It is what makes a lost optimistic-lock race safe to simply re-run.

Simulation state is plain data, and is never persisted. A run's truth is its
header — seed, content version, start tick and the frozen character snapshot —
plus the outcome it banks. The world inside the fight is rebuilt by replay and
thrown away. The one bounded exception: outcomes and death records are stored,
because "which element, which monster, which wave" is a balance question
needing queryable rows.

A live tick and an offline replay are the same call with a different tick
count. The moment they are two functions, [`alpha.md`](../alpha.md) decision 2
has been abandoned without anyone deciding to.

Project the character into the fight; never write the fight back. A run
returns an outcome and a use case applies it — two copies of equipment that
can disagree is the bug this prevents. A live edit is a fresh projection
*into* the arena, never a write out of it.

The character sheet is the simulation's modifier collection run with zero
ticks. One implementation of "additive within a stat, multiplicative between",
so the sheet cannot promise a number the fight will not deliver.

A live edit lands on a tick boundary, like any other input. Gear, gambits,
skill points and targeting all arrive as intent and take effect on the next
tick, which keeps one ordering rule rather than four.

Decide where new state goes by asking whether replaying the current run from
its header reproduces it. Yes means simulation state. No means it is a run
input or a banked outcome, and belongs to an aggregate.
