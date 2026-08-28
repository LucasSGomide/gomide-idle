# 01 — The API foundation: workspace, contract and the server's half of the first path

**Depends on:** — · **Status:** not-started · **Estimate:** 10

## Context

- The repository holds documentation and nothing else. This item writes the
  first line of code in it.
- Covers the API half of the **Project scaffolding** requirements: `UN.9`,
  `UN.11`–`UN.15` and `UN.21` in full, and the server side of `UN.10`.
  [`02`](02-the-web-foundation.md) covers the rest.
- Split from the web deliberately, decided 2026-08-28. One item covering both
  would have been the largest thing on the roadmap and unslicable — every web
  step waits on the OpenAPI document this item produces.
- This item owns everything repo-wide: the pnpm workspace, the linter, the
  boundary checker, the regenerate command and the CI workflow. `02` adds the
  web's own configuration into files this item creates rather than creating a
  second set.
- `UN.10` asks for proof that the layers connect. The server's half is an HTTP
  endpoint reading a seeded `server_meta` row through Drizzle, plus a socket
  handshake carrying the protocol integer. `02` is where the path visibly
  completes.
- That handshake is **unauthenticated**, decided 2026-08-28. `FR.3.2` wants it
  checked against a server-side session and there is no session yet; the
  **Account sign-up and login** item adds the check to a handshake that already
  exists, which is an edit rather than the throwaway `FR.10.4` forbids.
- The **Deployment** feature (`UN.17`–`UN.20`) is a separate roadmap item, not
  yet written. This item ships only the Postgres this repository needs to run
  its own migrations and tests.

## Key Areas:

- **Back-end** — four modules with four inward-only layers, the read path as a
  DAO rather than a repository, one normalised error shape and one log shape;
  `architecture-api.md` rules 19–24, 37, 48–52, 91.
- **API stack** — pnpm workspace, NestJS 12 on Fastify, Drizzle `1.0.0-rc.4`,
  Socket.IO, oxlint plus dependency-cruiser, `@nestjs/observe`, and the
  `preview: true` OpenAPI document; `stack-api.md` rules 29–33, 40–47.
- **Naming** — this item writes the first example of every convention, so a
  wrong one is copied by every item after it; `naming.md` rules 2, 7–12, 15.

## Technical Details:

1. Create the pnpm workspace: root `package.json` pinning Node 24, a
   `pnpm-workspace.yaml` naming `apps/*` and `libs/*`, and the
   `peerDependencyRules.allowedVersions` entry `stack-api.md` rule 41 requires
   for `nestjs-zod`'s `@nestjs/swagger ^11` peer.
2. Scaffold `libs/simulation` and `libs/content` as empty ESM packages with Jest
   configured for ESM. `libs/simulation` declares no runtime dependency;
   dependency-cruiser is what keeps it that way, not the `package.json`.
3. Scaffold `libs/contracts` and write its first Zod schemas — the `server_meta`
   response and the socket handshake payload — each carrying `.meta({ id })`.
4. Scaffold `apps/api` on NestJS 12 over Fastify with `trustProxy` on, holding
   the four modules `auth`, `player`, `character` and `hunt`, each with
   `domain/`, `application/`, `infrastructure/` and `entrypoint/`. `auth` and
   `player` hold no code yet.
5. Add the environment schema validated at start-up — a missing or malformed
   value stops the process and names the field — and commit a `.env.example`
   listing every variable the system reads.
6. Add `drizzle-orm` and `drizzle-kit` `1.0.0-rc.4`, plus a `docker-compose.yml`
   holding Postgres alone on the engine version the tests use, and write the
   first migration: the `server_meta` table and the row seeding the protocol
   integer, the content-pack version and the build id.
7. Build the read path for that row: `GetServerMetaDaoPort` in `application/`,
   `GetServerMetaDao` in `infrastructure/database/dao/`, a use case, and an HTTP
   controller in `entrypoint/` that decides nothing.
8. Add the exception filter normalising every HTTP response to
   `{ statusCode, code, message }`, and its socket twin, which emits the same
   `code` with the causing message's correlation id and never closes the
   connection.
9. Register `pino-http` in Fastify's `onRequest` hook, with `timestamp`,
   `level`, `module`, `message` and the correlation id at the top level and
   everything else under `context`.
10. Wire `@nestjs/observe` through NestJS 12's `instrument` bootstrap option in
    `main.ts` and the app module, reading `appKey` and `appSecret` from the
    environment so an absent credential sends nothing.
11. Add the Socket.IO gateway: the handshake sends the protocol integer and
    performs no session check.
12. Wire generation and the checks: emit the OpenAPI document by booting with
    `preview: true` and running `cleanupOpenApiDoc`, commit it, expose the one
    regenerate command `FR.11.6` asks for, and add a CI workflow running oxlint,
    dependency-cruiser from `apps/api`, type-checking, generated-file drift and
    Jest — one Postgres container per project in `globalSetup`, a schema per
    worker keyed off `JEST_WORKER_ID`, and no `.withReuse()`.

### Technical References:

- `stack-api.md` rules 29–33 — the workspace, the four modules, Jest under ESM.
- `stack-api.md` rules 40–42 — oxlint, the peer override, and dependency-cruiser
  with `tsPreCompilationDeps`, `combinedDependencies` and `exportsFields` set.
- `stack-api.md` rules 43–45 — `@nestjs/observe`, what it does not carry, and
  `pino-http` in the `onRequest` hook.
- `stack-api.md` rules 46–47 — `preview: true` and `.meta({ id })`.
- `stack-api.md` rules 15–17 — the protocol integer, Postgres, Drizzle
  `1.0.0-rc.4`.
- `architecture-api.md` rules 19–24 — the four layers and what may cross them.
- `architecture-api.md` rules 37, 45 — the two error categories and the socket
  filter.
- `architecture-api.md` rules 48–55 — the logging rules.
- `architecture-api.md` rule 91 — one container per Jest project, a schema per
  worker.
- `architecture-web.md` rule 32 — why `server_meta`'s content-pack version is
  carried and never compared.
- `naming.md` rules 10–12 — the DAO, the Drizzle table and the injection token.
- `requirements.md` `UN.9`–`UN.15`, `UN.21`.

## Blockers:

- `FR.10.2` seeds the build id in the first migration, but a build id fixed at
  migration time is stale on the next build. No rule in `stack-api.md` or
  `architecture-api.md` says where a build id comes from, so this item decides
  it.
- `@nestjs/observe` is `0.1.8` (`stack-api.md` rule 43), published the day
  before that rule, under an API that can still move — and NestJS 12's
  `instrument` bootstrap option has been exercised nowhere in this repository.
- `drizzle-orm`/`drizzle-kit` `1.0.0-rc.4` (`stack-api.md` rule 17) is a release
  candidate under the persistence layer, and its timestamped migration folder
  layout is new.
- `stack-api.md` rule 41 requires a test that fails if the `nestjs-zod` peer
  override's assertion is wrong. What that test asserts is not decided.
- `FR.9.1` puts `apps/web` in the workspace and this item does not create it —
  [`02`](02-the-web-foundation.md) does, so `FR.9.1` is met only across both.
