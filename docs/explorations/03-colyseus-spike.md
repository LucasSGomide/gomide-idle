# 03 — Colyseus, or a room abstraction we own

**Verdict:** ruled out · **Opened:** 2026-08-21 · **Closed:** 2026-08-22

> [`docs/stack-api.md`](../stack-api.md) rule 12 committed to WebSocket for the
> live hunt so that party hunts have a foundation on day one. It did **not**
> settle what runs on top of that socket. This exploration does, by building the
> thing rather than arguing about it.

## The question

Does Colyseus earn its operational surface for a game whose live channel carries
a **versioned event stream** rather than synchronized state?

## Why it is not obvious

Colyseus is MIT and free, so cost is not the objection. Its headline feature is
automatic state synchronization: declare a `@colyseus/schema` class, and it
diffs that object each patch interval and ships binary deltas to a client SDK
that applies them and fires change callbacks. Rooms, matchmaking and reconnection
come with it. Baiak Idle — the closest shipped comparable — runs on it, with
`chat`, `hunt`, `partyhunt`, `city`, `house`, `queue`, `arena` and `warzone`
rooms (see [`01-how-baiak-idle-works.md`](01-how-baiak-idle-works.md) §2.1).

Against that, four frictions specific to this project:

1. **Sync wants a second copy of the state.** `libs/simulation` has an empty dependency
   list and no decorators, which is what makes
   [`architecture-api.md`](../architecture-api.md) rules 1–5 self-enforcing.
   Getting Colyseus sync means either decorating the simulation state — which
   also welds the save blob to the wire format, so a rendering change becomes a
   save migration — or maintaining a parallel schema and copying into it.
2. **Sync and events are different paradigms.** The renderer rules
   ([`architecture-web.md`](../architecture-web.md) 7–9) are built on an event
   stream with an interpolation buffer. Sync says HP went 400→160; it does not
   say it was a crit. Damage numbers, hit flashes and cast telegraphs are events
   and would travel by `room.send()` regardless — using Colyseus as a message bus
   and ignoring the feature it was adopted for.
3. **It owns its own server.** Colyseus runs its own transport and room
   lifecycle, so inside NestJS it is either two server concepts in one process or
   a second deployable — and `LoggerPort`, `ApiError` and DI do not reach inside
   a `Room`.
4. **Rooms of one.** All of the above is paid now for a capability that arrives
   with party hunts.

And the counter, which is real: if party hunts are coming and Colyseus is the
validated answer, hand-building a room abstraction may be building something to
throw away.

> **Amended 2026-08-22 by [02](02-domain-model.md).** Two of this spike's
> assumptions moved. `architecture-api.md` rule 21 makes a dropped socket *end*
> the live hunt, so **reconnection is no longer a capability arm A has to
> match** — it is a capability the design rejects. And rule 18 means there is no
> save blob, so friction 1's "welds the save blob to the wire format" is now
> only "welds the run header to the wire format", which is a much smaller
> objection. Re-read the bar below before running the spike.

## The question the spike actually decides

> When party hunts arrive, will four players share one server-synced state
> object — or will each client receive the same event stream, filtered?

If state sync, Colyseus is right and adopting it now avoids a migration. If the
same event stream with more subscribers, it never earns its keep, and what would
have been thrown away is a `Map<huntId, Set<connection>>`.

## The spike

> **Not run.** It was written on 2026-08-21, when the rules it depended on were
> still open. They closed the next day — see [Findings](#findings). The plan is
> kept below because what it planned to measure is what the findings have to
> answer without measurements.

Timebox: one day. Build the smallest honest version of both, not a toy.

- [ ] A `runTicks` stub good enough to emit a real event stream — cast, hit,
      crit, death, spawn — at the alpha's tick rate, with seeded RNG and a
      handful of entities moving on a tile grid. No balance, no content.
- [ ] **Arm A:** a NestJS WebSocket gateway over `ws`, rooms as a map from hunt
      to connections, pushing the event stream with a protocol version.
- [ ] **Arm B:** the same stream through a Colyseus room, with sim state mapped
      into a `@colyseus/schema` class each tick and discrete events sent by
      `room.send()`.
- [ ] A trivial client for each that applies the two-tick interpolation buffer
      and renders positions as coloured divs. Enough to see it move.

## What it must report

- [ ] How large the sim-state-to-schema mapping layer is in arm B, and whether it
      needs touching every time a mechanic is added.
- [ ] Whether anything in arm B tempts a decorator into `libs/simulation`, and what it
      would cost to refuse.
- [ ] What arm B's `Room` gives up from the `backend-standards` layering — DI,
      `LoggerPort`, `ApiError` — and whether that is bridgeable or just accepted.
- [ ] What arm A does not have that party hunts would need, stated as a list of
      work rather than a feeling. Room lifecycle is the suspect; reconnection
      is not, per the amendment above.
- [ ] Whether the event stream survives Colyseus's patch interval intact, or
      whether ordering and timing get reshaped by it. Ordering is a correctness
      requirement here ([`architecture-api.md`](../architecture-api.md) rule 4).
- [ ] Deployment shape of each: one process or two.

## Bar

Colyseus wins if arm B's mapping layer is small and stable **and** it removes
work that party hunts would otherwise require. It loses if the mapping layer
grows with every mechanic, or if the event stream ends up travelling by
`room.send()` anyway — because then the schema is carrying nothing the renderer
reads.

## Findings

**Ruled out, without running the spike.** Between the day this was written and
the day it closed, [02](02-domain-model.md) settled the rules it was waiting on —
and those rules answer its deciding question directly. Building both arms would
have measured a choice that had already been made elsewhere.

### The deciding question, answered

> When party hunts arrive, will four players share one server-synced state
> object — or will each client receive the same event stream, filtered?

**The same event stream, and not even filtered.** A hunt is one deterministic
simulation over a frozen header: every input is fixed at run start
([`architecture-api.md`](../architecture-api.md) rule 22), the player cannot act
during the fight ([`architecture-web.md`](../architecture-web.md) rule 7), and
nothing is ever written back into it (`architecture-api.md` rule 24). A party
hunt projects four characters into the run instead of one — it does not add a
second writer. Four players watching one fight see identical events for the same
reason two of one player's tabs would.

State synchronization is the answer to *several clients are changing one world
and must converge*. Nothing changes this world but `runTicks`: single-writer,
strictly ordered, replayable from a seed. Colyseus's headline feature solves a
problem this design does not have, and party hunts do not create it.

### The bar, applied

The bar said Colyseus loses if the mapping layer grows with every mechanic **or**
if the event stream ends up travelling by `room.send()` anyway. Both halves are
already true, before a line is written:

- **The mapping layer grows with every mechanic that has a visual.** Rule 15 and
  [`stack-api.md`](../stack-api.md) rule 7 keep decorators out of
  `libs/simulation`, so arm B's schema is necessarily a parallel class maintained
  by hand, plus a per-tick copy. Every new component with a rendered
  consequence — a shield, a status effect, a second resource bar — is an edit in
  two places, forever.
- **The stream travels by `room.send()` regardless.** `architecture-web.md`
  rules 1, 8 and 9 make the renderer a consumer of *discrete* events: crit, cast
  telegraph, spawn, death, and the distinction between events with lasting visual
  state and events without it. A schema diff says HP went 400→160; it cannot say
  it was a crit, and it cannot say what to drop when the tab was backgrounded.
  The schema would carry nothing the renderer reads.

There is also a third failure the spike would have found and the plan only half
suspected: **two clocks.** Colyseus patches on its own interval; the simulation
has one permanently fixed tick rate (rule 7) and event ordering is a correctness
requirement (rule 4). Making patches usable by the interpolation buffer means
stamping the tick number into the schema and buffering on that — rebuilding the
event stream *inside* the sync channel.

### What Colyseus would have given, item by item

| What it offers | Verdict here |
| --- | --- |
| Automatic state synchronization | Not wanted — the wire format is a versioned event stream |
| Client SDK with change callbacks | Wrong shape — rule 7 wants two bracketing snapshots keyed by tick, not a mutated object |
| Reconnection | Rejected by design — `architecture-api.md` rule 21 ends the hunt with the socket |
| Matchmaking and seat reservation | Account-shaped, therefore HTTP — `stack-api.md` rule 12 |
| Room lifecycle | Real, and it is a `Map<runId, Set<connection>>` |
| Multi-process presence via Redis | The thing `stack-api.md` rule 24 deliberately defers |

Reconnection was the strongest item on that list when the spike was written. Rule
21 removed it.

### What we own instead, stated as work

The spike asked for arm A's gap as a list rather than a feeling. Post-amendment
it is short, and none of it is what Colyseus is for:

1. A registry from run id to connections, created when a run starts and closed
   when it banks its outcome.
2. Authorization on join: is this character a member of this run.
3. Per-connection write backpressure — one slow client must not stall the tick.
4. A policy decision for party hunts that rule 21 currently answers for one
   player: whose dropped socket ends a shared hunt. Colyseus would not have
   answered this either.

That is the thing the exploration worried about throwing away. It is bounded, and
it is smaller than arm B's mapping layer alone.

### What happened to `stack-api.md` rule 14

| Rule | Was | Now |
| --- | --- | --- |
| `stack-api.md` 14 | what runs on the socket is unsettled, see this spike | a room is a map from run to connections, owned in the NestJS gateway; no Colyseus |

### What was not measured, and what would reopen this

No numbers were taken. Fan-out cost per connection and Colyseus's behaviour under
load are unmeasured — and neither is what the bar asked about.

Reopen if any of these becomes true:

- **The player can act during a live fight.** `architecture-web.md` rule 7 is
  load-bearing for this whole finding: the moment input arrives mid-fight, two
  clients can diverge and convergence becomes a real problem.
- **A party hunt needs per-player state a shared replay cannot derive** — private
  loot rolls, per-player visibility, anything where "filtered" stops being a
  no-op.
- **Rule 21 softens** to allow reconnecting into a hunt still running on the
  server.
