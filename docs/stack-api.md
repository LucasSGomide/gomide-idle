# API stack rules

Rules for anything api stack-shaped. `project.yml` points every
`**API stack**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

Settled 2026-08-21. The measurements and comparisons behind these choices are in
[`docs/research/api-stack-2026-08.md`](research/api-stack-2026-08.md); this
file carries the rule, that file carries the argument.

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
   events must arrive in a deterministic order (`architecture-api.md` rule 4), and
   a bus is the one place that ordering silently stops being guaranteed.

6. **Keep every other rule in the `backend-standards` skill.** The layering, the
   ports, the repository mapping, the `ApiError` hierarchy and the `LoggerPort`
   are unaffected by dropping the bus — only the dispatch mechanism changed.

## The simulation package

7. **No NestJS, no decorators and no DI inside `libs/sim`.** The determinism
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

12. **WebSocket for the live hunt, HTTP for everything account-shaped.**
    Characters, inventory, the priority list and hunt selection are
    request/response; combat is a stream, and mixing them makes both worse.

13. **The socket pushes the output of the same `runTicks` the offline replay
    calls.** Two code paths for combat is exactly what `alpha.md` decision 2
    exists to prevent, and a live tick is a replay with a small `ticks` argument.

14. **What runs on top of the socket is unsettled — see
    [`explorations/03-colyseus-spike.md`](explorations/03-colyseus-spike.md).**
    Colyseus is free and validated by Baiak Idle, but its value is synchronized
    state while this design carries an event stream, so the spike decides it
    rather than an argument.

15. **Version the socket protocol as an integer the client hard-codes.** A stale
    client that silently renders nonsense costs more to diagnose than one that
    refuses to connect.

## Persistence

16. **Postgres, with the schema hybrid: real columns for anything queried, one
    JSONB blob for simulation state.** Positions, buffs, cooldowns, the modifier
    source list and the PRNG state are never queried by the database, and
    modelling them relationally buys no query capability and costs a migration
    per mechanic.

17. **MikroORM.** At six tables the differentiators between ORMs evaporate, so the
    tiebreaker is the migration workflow already trusted.

18. **`state_version` is a real column, never a key inside the JSON.** Finding
    un-migrated rows is a query.

19. **Migrate saved state lazily on read, one version step at a time.** A save
    untouched for months still loads, and no maintenance window is ever needed.

20. **Pin the content-pack version in every persisted hunt.** A replay is only
    reproducible against the content it ran with, so rebalancing a monster
    otherwise breaks every stored hunt log the first time it happens.

21. **Guard a replay with an advisory lock and a version compare-and-swap.** The
    lock avoids the wasted work of two concurrent replays, the CAS is what
    guarantees correctness when the lock is lost — and retry is free only because
    the simulation has no side effects until the final write.

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
    standards.** `packages/sim` and `packages/content` are `libs/` in that
    vocabulary.

31. **`libs/content` exports the JSON and the validator together.** Shape and
    referential integrity are checked in one place used by both apps, which is
    what makes `architecture-api.md` rules 12–13 enforceable rather than
    aspirational.

32. **Jest everywhere, including the framework-free packages.** One runner and
    one set of conventions across the repo beats a per-package optimum, and the
    `backend-standards` testing rules are already written against Jest.

33. **Configure Jest for ESM in `libs/sim` rather than compiling it down.**
    `libs/sim` is ESM-native so it survives the NestJS 12 migration untouched,
    and the runner is the thing that should bend.
