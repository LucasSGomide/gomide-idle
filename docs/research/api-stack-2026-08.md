# API stack — the research behind the rules

Researched 2026-08-21. The rules live in [`docs/stack-api.md`](../stack-api.md);
this file is the argument, so that file can stay one line per rule.

## The measurement that reframed everything

A representative arena tick was benchmarked before anything was priced: one
player plus N monsters, nearest-target selection, one-tile steps with tile
reservation, ordered priority-list skill choice, seeded PRNG, fixed-point
integer damage with crits, wave respawn. Plus a deliberately pessimistic variant
that rebuilds a modifier-source list per entity per tick, sweeps buff expiry and
allocates an event object per hit.

Ten hours at 10 Hz is 360,000 ticks. On one core, Node 24:

| Variant | 8 monsters | 20 monsters |
| --- | --- | --- |
| Lean | 51 ms | 261 ms |
| Modifier lists + event objects + buff sweep | 89 ms | 344 ms |

Roughly 1–4 million ticks per second. **A ten-hour catch-up is sub-second.**
Assume the real simulation is 20× heavier and the host CPU 3× slower and the
worst case is ~20 seconds; realistically 1–3.

Two consequences:

- Decision 2 is dominant for **correctness** and irrelevant for **capacity**. Do
  not choose infrastructure to serve it.
- `architecture-api.md` rule 10's catch-up cap is still right, but it is a
  game-balance number (24–72 h), not a timeout defence.

Thirty players logging in simultaneously after ten hours away is about 30
CPU-seconds in total.

## Hosting

Deferred deliberately — the container is the commitment, the host is not.

| Option | 2026 reality |
| --- | --- |
| AWS Lambda / SST | 900 s hard timeout (replay needs ~1 s), permanent free tier covers the whole alpha. Ruled out by sockets, not by CPU. NestJS cold start 0.4–1 s. |
| Fly.io | shared-cpu-1x 512 MB ≈ $3.32/mo, 1 GB ≈ $5.92/mo. Free tier is gone. Needs `min_machines_running = 1` or auto-stop reintroduces a cold start. |
| Render | Real free tier survives, but spins down after 15 min idle and takes ~60 s to wake — unacceptable for a game friends open casually. Paid: $7 web + $7 Postgres. |
| Railway | Free plan is $1/mo of non-rollover credit; effectively the $5/mo Hobby plan. |
| Hetzner CX22 | 2 vCPU / 4 GB / 40 GB NVMe ≈ €4.49/mo after the April 2026 increase. Postgres on the same box, no network hop. You own patching, TLS, backups. |

Sockets rule out serverless, so the choice is between the always-on options and
that can wait. Cloudflare in front of it is orthogonal — Baiak Idle uses it to
mask its origin entirely.

## Live session

Three shapes were compared: WebSocket push, SSE push, and lazy evaluation where
the client polls and the server replays the elapsed ticks.

Lazy evaluation was the cheapest — "live" becomes offline replay with a small
tick count, and a 3–5 second render lag is invisible because decision 3 means
there is nothing to react to. It was **not** chosen: party hunts are wanted
later, and two players seeing the same monster at the same instant needs a push
transport. Building the foundation once was judged worth more than the saving.

The unification survives regardless: the server still calls one `runTicks` and
pushes its output instead of waiting to be asked.

On Colyseus specifically — `docs/explorations/01-how-baiak-idle-works.md` §3.4
argued against it on two legs. `alpha.md` broke one (progress is no longer "a
rate, not an event stream") and left the load-bearing one standing: Baiak runs
`chat`, `hunt`, `partyhunt`, `city`, `house`, `queue`, `arena` and `warzone`
rooms, and Colyseus exists to keep several people's screens agreeing. Rooms of
one player are a data structure.

That argument was judged strong enough to raise and not strong enough to settle,
because Colyseus is free and adopting it later is a real migration. It is now a
spike: [`explorations/03-colyseus-spike.md`](../explorations/03-colyseus-spike.md).

API Gateway WebSocket pricing, for the record if serverless ever returns:
$1.00/M messages plus $0.25/M connection-minutes, billed even at zero traffic.
At 30 players × 2 h/day that is cents — complexity was the objection, not cost.

## NestJS and CQRS

NestJS 11 is current stable. **v12 (~Q3 2026)** is a large release: full
CommonJS→ESM migration across every official package, Standard Schema support in
`@Body`/`@Query`/`@Param` (ending the class-validator dependency), Vitest
replacing Jest, oxlint replacing ESLint, Rspack replacing Webpack. Writing
`libs/sim` as ESM-native with no decorators makes it immune to all of it.

The command bus was dropped and replaced with use cases. The argument:

- The whole write surface is roughly five operations — create character, set
  priority list, equip item, start hunt, advance hunt — each with one caller.
- The one interesting operation is already `(state, ticks) → (state, events)`.
  A pure function is a better command bus than a command bus.
- A bus is a natural home for *events*, and combat events must arrive in a
  deterministic order (`architecture-api.md` rule 4). Two things called "events"
  that must never touch is a trap worth not building.
- Adding `@nestjs/cqrs` later is a couple of hours. Removing it is a refactor.

Everything else in the `backend-standards` skill was kept.

## Persistence

**Postgres.** Provider deferred with the host. Options if managed: Neon free
plan (0.5 GB, 100 CU-hours, suspends after 5 min idle, 300–800 ms cold start,
branching per migration test) or Supabase free tier (500 MB, **projects pause
after 7 days of no requests and need a manual dashboard resume** — a real hazard
for an alpha that goes quiet for a week). On a VPS, local Postgres has none of
these properties. The login burst is CPU in the Node process, not database work,
so a sub-second DB wake is annoying UX, not a throughput problem.

**Shape: hybrid.** Real columns for anything queried, joined or constrained —
`character(id, user_id, name, level, xp, class, state_version, sim_counter)`,
`item(id, character_id, slot, tier, prefix, suffix, equipped)`,
`hunt_run(id, character_id, hunt_id, seed, content_version, started_at_tick, status)`.
One JSONB blob for simulation state: positions, HP, buffs with expiry ticks,
cooldowns, the modifier source list, and the PRNG state. None of it is ever
queried; modelling it relationally buys nothing and costs a migration per
mechanic.

**MikroORM.** The known objection is serverless overhead, which does not apply
on a container. At six tables the differentiators evaporate and the tiebreaker
is migration confidence — which rule 8 makes the single most valuable ORM
property here.

> **Superseded 2026-08-26.** `stack-api.md` rule 17 now names **Drizzle**. The
> reasoning above still holds — at six tables the differentiators do evaporate —
> but it weighed a tiebreaker that turned out not to be the binding one. Better
> Auth ships a supported Drizzle adapter and none for MikroORM, so MikroORM meant
> hand-authoring the auth entities from generated SQL and re-doing that by hand on
> every Better Auth schema change. One migration tool for the whole schema beat
> familiarity with a second one. Left in place because it is the argument as it
> stood on 2026-08-21.

**Concurrency.** Two tabs, or a poll firing while a slow one is in flight, both
replay from tick T and one write is lost. `SELECT … FOR UPDATE` is correct but
holds a transaction open across the whole replay. Optimistic compare-and-swap on
a `sim_counter` column is better here because conflicts are rare and a failed CAS
costs a discarded replay that is free to re-run — which is only true because the
simulation has no side effects until the final write. Add
`pg_try_advisory_xact_lock(characterId)` on top to make it a 409 instead of
wasted work.

## Determinism

**PRNG: sfc32, hand-written.** mulberry32 is smaller (one uint32 of state) but
sfc32's 128-bit state is better quality at the same cost and still four uint32
words that serialize to JSON exactly. PCG32 has the best statistics and needs
64-bit arithmetic, which in JavaScript means BigInt or manual limb-splitting —
its advantage is irrelevant at 30 players.

Implementation notes that matter more than the choice:

- Stay in uint32 throughout via `| 0`, `>>> 0` and `Math.imul`.
- Expose `nextU32()` and `nextInt(n)`, never `nextFloat()`. Rejection sampling
  for `nextInt`, not modulo — so the *number of PRNG calls* stays a deterministic
  function of state.
- **Separate streams for combat and loot.** Otherwise adding one crit roll shifts
  every future drop in every existing save. This is the most likely way to break
  reproducibility without touching the algorithm.

**Fixed point.** Multipliers at scale 10,000 as int32: base crit 1.5 → `15000`,
and `15000 + 3000 + 2000 = 20000` is `alpha.md`'s worked example with no float
error. Damage and HP at scale 100 so partial regen accumulates instead of
truncating to zero. Multiply then divide: `(a * b / 10000) | 0`. Keep products
under 2^53 — with damage ≤ 10^7 and multipliers ≤ 10^5 the product is ≤ 10^12,
three orders of headroom. Order of operations is part of the contract.

**The CI suite is four tests, and two of them are the point:**

1. Same seed twice → identical event stream. Passes even with a stray
   `Math.random()` in one process, so it is the weakest of the four.
2. **One pass of 100k ticks equals 100 resumed chunks of 1k.** This is what
   actually proves the call counter is saved and no clock is read.
3. **A JSON round-trip mid-stream continues identically.** The only test that
   catches rule 4 — a live `Map` iterates in insertion order, the same state
   rebuilt from JSON does not. Never appears in a single-process test, always
   appears in production.
4. A committed golden hash, so a deliberate change tells you it changed and you
   consciously decide whether to bump the state version.

`canonicalJson` must sort keys recursively or the whole suite passes for the
wrong reason.

## Auth

**Better Auth.** MIT, self-hosted, no per-MAU metering, and the users and
sessions are tables in the project's own Postgres — so "migrating off later" is
not a question. Clerk's headline 50,000 free tier is *monthly returning users*,
a less generous metric than it appears, and its user data lives with Clerk.
Rolling your own means password hashing, session rotation, email verification
and rate limiting — four ways to burn a week on something that is not the game.

The NestJS adapter is community-maintained, which is why the rules keep it
behind one guard of our own.

## Monorepo

pnpm workspaces alone. With four packages and one developer, Turborepo would be
caching a build that takes seconds; it is a one-file addition later, which is
exactly why adding it now is premature. Trigger: CI over ~2 minutes, or a third
app.
