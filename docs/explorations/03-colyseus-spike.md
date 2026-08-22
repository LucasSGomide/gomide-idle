# 03 — Colyseus, or a room abstraction we own

**Verdict:** open, spike not yet run · **Opened:** 2026-08-21

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

<!-- Nothing yet. This section is written when the spike closes. -->
