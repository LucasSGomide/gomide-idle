# API stack rules

Rules for anything api stack-shaped. `project.yml` points every
`**API stack**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

Settled 2026-08-21, after a representative arena tick was benchmarked and the
runtime, the transport, the database, auth and the monorepo were each compared.
Those measurements lived in `docs/research/api-stack-2026-08.md`, removed
2026-08-27 — `git log --full-history -- docs/research/api-stack-2026-08.md`
finds them. The one number to keep in front of you: one player plus twenty
monsters, ten hours at 10 Hz — 360,000 ticks — replayed in 261 ms on one core,
or 344 ms in a deliberately pessimistic variant that rebuilds a modifier-source
list per entity per tick and allocates an event object per hit. That is roughly
one to four million ticks a second, so a ten-hour catch-up is sub-second and
thirty players returning at once costs about thirty CPU-seconds in total.

It reframed everything below. [`alpha.md`](../alpha.md) decision 2 is dominant
for **correctness** and irrelevant for **capacity**, so nothing here is chosen
to serve it — and the catch-up cap is a game-balance number rather than a
timeout defence.

## Runtime and framework

1. **Node LTS, TypeScript, ESM everywhere.** NestJS 12 (~Q3 2026) migrates every
   official package from CommonJS to ESM, and code written as ESM today is immune
   to that migration.

2. **NestJS 11, not the v12 preview.** v12 also swaps Jest for Vitest, ESLint for
   oxlint and Webpack for Rspack — three toolchain changes to absorb at once, and
   none of them are blocking anything.

3. **Fastify, not Express.** It is what the logging rules already assume — request
   context is initialized in Fastify's `onRequest` hook.

4. **Use cases, not a command bus.** The write surface is roughly five operations
   with one caller each, and the one interesting operation is already the pure
   function `runTicks(state, content, ticks)` — a command bus wrapped around a
   better command bus.

5. **Never route simulation events through an async in-process bus.** Combat
   events must arrive in a deterministic order (`architecture-api.md`'s
   determinism section), and a bus is the one place that ordering silently stops
   being guaranteed.

6. **Keep the layering, the ports, the repository mapping, the `ApiError`
   hierarchy and the `LoggerPort` — they are written out in
   [`architecture-api.md`](architecture-api.md) rules 19–86.** Dropping the bus
   changed the dispatch mechanism and nothing else. *Revised 2026-08-26; this
   rule previously deferred to a personal `backend-standards` skill. That skill
   lived in a global Claude config outside this repository, was written for
   another project, and encoded MikroORM concretely — so it could not be a
   dependency of this one. Its rules were adapted into `architecture-api.md`,
   which is where they now live.*

## The simulation package

7. **No NestJS, no decorators and no DI inside `libs/simulation`.** The determinism
   suite must be runnable without booting a framework, or it will eventually be
   skipped.

8. **Implement sfc32 by hand, with an integer-only public API.** Its four
   `uint32` words serialize to JSON and resume mid-stream exactly, and exposing
   only integer primitives removes float non-determinism at the source rather
   than relying on review to catch it.

9. **Fixed-point scale is 10,000 for multipliers and 100 for damage and health.**
   A stated scale is what makes `1.5 + 0.30 + 0.20 = 2.0` an integer addition
   instead of a float that drifts.

10. **Pick one order of operations for the damage formula and comment why it
    cannot be simplified.** `(a * b / 10000 * c / 10000) | 0` and
    `(a * b * c / 100000000) | 0` give different answers, and both look correct.

11. **The determinism suite runs on every commit, separately from the API
    tests.** Four tests — same seed twice, chunked resume equality, a committed
    golden hash, and a JSON round-trip mid-stream — and the resume and
    round-trip ones are the two that catch real bugs.

## Transport

12. **The socket is presence: it opens at character select and the hunt runs
    over it. HTTP for everything account-shaped.** An open socket is what
    "online" means — sign-up, sign-in, the character sheet, inventory and the
    rule lists stay request/response, but a character is in the world for as
    long as its socket lives. *Revised 2026-08-26; this rule previously said the
    socket was the hunt itself.* Presence has to outlive a single fight because
    a city and world chat are coming, and because an account's
    one-character-online limit (rule 35) needs something to hang off that a
    between-hunts player still holds.

13. **The socket pushes the output of the same `runTicks` the offline replay
    calls.** Two code paths for combat is exactly what `alpha.md` decision 2
    exists to prevent, and a live tick is a replay with a small `ticks` argument.

14. **A room is a map from run id to connections, owned by the NestJS gateway —
    no Colyseus.** Synchronization exists to make several writers converge, and
    a hunt has exactly one writer (`runTicks`) whose output is already an
    ordered event stream; see
    [`explorations/03-colyseus-spike.md`](explorations/03-colyseus-spike.md)
    for the reopen conditions.

15. **Version the socket protocol as an integer the client hard-codes.** A stale
    client that silently renders nonsense costs more to diagnose than one that
    refuses to connect.

## Persistence

16. **Postgres, real columns throughout — equipment ids and skill levels
    included; JSONB only for the run header's frozen rule list.** No simulation
    state is stored at all (`architecture-api.md`'s simulation-boundary
    section), so the hybrid schema's blob has nothing left to hold, and the rule
    list is the one input whose length varies.

17. **Drizzle, and `drizzle-kit` owns every migration in the repo.** At six
    tables the differentiators between ORMs evaporate, so the tiebreaker is
    whichever one Better Auth supports directly — and that is Drizzle, not
    MikroORM. *Revised 2026-08-26; this rule previously named MikroORM, whose
    tiebreaker was migration confidence.* Better Auth's `generate` emits a
    Drizzle schema for the auth tables, `drizzle-kit` diffs and applies it
    alongside the game tables, and Better Auth's own `migrate` command is never
    run. The alternative was hand-authoring auth entities from generated SQL and
    re-doing it by hand on every Better Auth schema change.

18. **Migrate the run header like any other table.** It is one row per player
    currently offline, so a shape change is an ordinary migration and the schema
    stays strict — tolerating optional fields forever costs more, in every
    reader, than paying once.

19. **Never store a fight in order to resume it; re-run it from its header.** A
    sealed offline session is replayed exactly once at the next login and a live
    hunt dies with its socket, so there is no world state to version, migrate or
    lazily upgrade.

20. **Pin the content-pack version in every persisted hunt.** A replay is only
    reproducible against the content it ran with, so rebalancing a monster
    otherwise breaks every stored hunt log the first time it happens.

21. **Guard a catch-up with an advisory lock and a compare-and-swap on the run's
    status.** Two attempts to bring the same character online at once must not
    bank the same outcome twice; the lock avoids the wasted work, the CAS is what
    guarantees correctness when the lock is lost — and retry is free only because
    the simulation has no side effects until the final write. *Revised
    2026-08-28; this read "two tabs logging in at once", which named the wrong
    moment. `requirements.md` FR.6.2 replays a sealed session when its character
    comes online, not when the account signs in, and rule 35's claim is what two
    attempts actually race for — so a guard built at the sign-in path would sit
    where the race is not.*

## Deployment

22. **Ship a Docker container with no host-specific coupling.** The host is
    deliberately undecided; a container that runs unchanged on Fly, Render, a VPS
    or Cloud Run keeps it that way.

23. **Never serverless.** Sockets need a process that stays alive, and every
    always-on assumption in these rules follows from that.

24. **Assume one process for now, and keep character-to-process affinity in mind
    before adding a second.** A socket connection is stateful, so scaling out is a
    routing decision, not a replica count.

25. **Local development runs Postgres in Docker Compose.** The same database
    engine and version as production, or integration tests prove the wrong thing.

## Auth

26. **Better Auth, with sessions in the project's own Postgres.** `user_id` is a
    foreign key on `character`, so auth living in the same transactional database
    as game state is a simplification rather than a preference — and migrating off
    is a non-question when the tables are already yours.

27. **Server-side sessions, not stateless JWTs.** The server is authoritative and
    hits the database on every request anyway, which makes revoking a session a
    `DELETE` instead of a rotation scheme.

28. **Keep the NestJS integration behind one guard of the project's own.** The
    Nest adapter is community-maintained, and wiring the framework-agnostic
    handler directly is a couple of hours only if nothing else imported it.

## Monorepo

29. **pnpm workspaces, no Turborepo and no Nx.** Four packages and one developer
    means the caching would be caching a build that takes seconds.

30. **`apps/` for deployables, `libs/` for shared code, per the existing
    standards.** `libs/simulation` and `libs/content` are the two shared
    packages; `apps/api` divides into `auth`, `player`, `character` and `hunt`.
    *Revised 2026-08-28; this rule named three modules — `character`, `hunt` and
    `auth` — which left the game's own idea of a player with nowhere to live.
    [`auth.md`](auth.md) rule 6 forbids product data in Better Auth's tables and
    did not say where it goes instead, so a language setting had a rule against
    its obvious home and no stated alternative.* `auth` holds the library and
    nothing else; `player` holds `player_account`, the game's row for an account,
    keyed by the Better Auth user id. `character` and `hunt` are unchanged — an
    account owning its characters is a foreign key, not module membership, and
    the character aggregate is the largest in the game.

31. **`libs/content` exports the JSON and the validator together.** Shape and
    referential integrity are checked in one place used by both apps, which is
    what makes `architecture-api.md`'s content-is-data rule and `alpha.md`'s
    referential-integrity requirement enforceable rather than aspirational.

32. **Jest in `apps/api` and in every `libs/` package, the framework-free ones
    included.** Jest is what NestJS 11 ships and documents, and rule 2 already
    declined the v12 preview that swaps it for Vitest — so the runner here is
    the framework's own default, and holding every package the API boots with to
    it is what lets [`architecture-api.md`](architecture-api.md) rules 70–86 be
    written once. *Revised twice, both on 2026-08-26. First: this rule rested on
    the `backend-standards` skill's testing rules already being written against
    Jest; those rules are now `architecture-api.md` rules 70–86 and are still
    written against Jest, but a rule doc citing a rule doc is not a reason.
    Second: the scope read "Jest everywhere", justified by "one runner and one
    set of conventions **across the repo** beats a per-package optimum" and
    closing with "picking Vitest now would mean running two runners until that
    migration lands". `stack-web.md` rule 41 then put Vitest on the web
    deliberately, so the repo runs two runners today — the across-the-repo claim
    was false the day it was written and the warning describes the world as it
    now is. The scope is narrowed to what this file governs; the reason is
    unchanged.* The two-runner price is named by `stack-web.md` rule 41 rather
    than here, and it lands on this side too: `libs/content` is imported by the
    web (rule 31) and tested under a runner the web does not run.

33. **Configure Jest for ESM in `libs/simulation` rather than compiling it down.**
    `libs/simulation` is ESM-native so it survives the NestJS 12 migration
    untouched, and the runner is the thing that should bend.

## Presence

Added 2026-08-26, settled while writing the requirements for **Account sign-up
and login**. Rule 12 was revised in the same pass.

34. **Socket.IO, not raw `ws`.** Three things this project needs are
    configuration rather than code with it: the heartbeat rule 36 requires,
    reconnection for the grace window in rule 37, and rooms, which are exactly
    the run-id-to-connections map rule 14 already describes. It is also NestJS's
    default gateway transport, so it is the path with the least wiring.

35. **An account has at most one character online at a time, and the claim is
    made synchronously.** A second connection is refused rather than allowed to
    kick the first, so nothing already running is ever interrupted by something
    the player did in another tab. Check-and-claim must happen in one
    synchronous block with no `await` between the check and the write, or two
    connections arriving together both pass the check. Keep it behind one named
    component: it is correct only in a single process, and rule 24 means that
    assumption expires the day a second one is added.

36. **Tune the heartbeat down from Socket.IO's defaults.** `pingInterval: 25000`
    and `pingTimeout: 20000` mean a vanished client goes unnoticed for about 45
    seconds — nine times the five-second leave the game promises, during which
    the character is still fighting and can still die with nobody watching. A
    cleanly closed tab sends a close frame and is instant; the heartbeat only
    governs the half-open case, which is exactly the mobile case. Detection can
    never be instant, so the goal is proportion, not perfection.

37. **Reconnecting inside the five-second leave cancels the leave.** The window
    the game already grants for quitting doubles as the reconnect grace, so a
    brief blip stops costing a hunt. This is what makes rule 36's aggressive
    timeouts safe: a false disconnect is cheap when reconnecting resumes the
    fight, so the heartbeat can be tuned for fast detection rather than for
    avoiding false positives.

38. **Authenticate the socket handshake against the same server-side session,
    and check `Origin` on every connection.** The cookie rides along on the
    upgrade request automatically, which is also why cross-site WebSocket
    hijacking exists — CORS does not govern the handshake, so `Origin`
    validation is the check that replaces it.

## Rate limiting

Added 2026-08-27, when [`auth.md`](auth.md) was written and FR.5.1 needed a
mechanism rather than an intention.

39. **Rate-limit with Better Auth's own limiter for the per-address half, and a
    `hooks.before` middleware of ours for the per-account half — not
    `@nestjs/throttler` and not a second package.** Sign-in is the only endpoint
    the alpha rate-limits (FR.5.1) and it is the library's own route, so a
    Nest-side guard would be limiting a handler it does not own, by path, after
    the library had already counted the attempt. [`auth.md`](auth.md) rule 17 is
    the policy and names the price: the counters live in this process's memory
    (FR.5.3), which is correct only while rule 24 holds and fails silently rather
    than loudly on the day it does not. *Revised 2026-08-28, after Better Auth
    1.7.2's limiter was read rather than assumed. Its key is hard-coded as
    `` `${ip}|${path}` `` — there is no configuration surface that changes it,
    `customRules` only adjusts the window and max for a path, and `customStorage`
    is handed the key rather than asked to build one. So the library buys FR.5.1's
    per-address half outright and its per-account half not at all, which this rule
    previously implied it covered.*
