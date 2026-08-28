# 02 — The API app boots on Fastify with a validated environment

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** 01

## Context

- Creates `apps/api` and the module structure every later slice writes into.
- **Five modules, not four.** `FR.9.7` supersedes `FR.9.3`: `system` joins
  `auth`, `player`, `character` and `hunt`. It owns what belongs to the running
  server rather than to a game system — the `server_meta` read path in task `05`
  and, later, `FR.19.2`'s health check. App-level code was the alternative and
  was rejected because it sits outside the boundary check `FR.12.2` runs.
- `auth` and `player` hold no code yet. Their folders are placed, not populated.
- dependency-cruiser lands here rather than in task `01` because the four-layer
  boundary it exists to police arrives with the modules, and `stack-api.md`
  rule 42 runs it from `apps/api`.
- The boundary check is a separate step from the linter on purpose: oxlint
  cannot express a path-to-path rule at all (`architecture-api.md` rule 19).
- `trustProxy` is not incidental — a log line and a rate-limit counter have to
  see the real caller rather than the proxy (`FR.13.5`).

## Technical details

- **API stack** — `apps/api` on NestJS 12 over Fastify with `trustProxy` on, so
  the client address comes from the proxy's forwarded header (`FR.13.5`).
- **Back-end** — five modules — `auth`, `player`, `character`, `hunt`, `system` —
  each with `domain/`, `application/`, `infrastructure/` and `entrypoint/`, with
  imports pointing inward only (`architecture-api.md` rules 19–24, `FR.9.7`).
- **Back-end** — nothing from NestJS, Drizzle, Socket.IO or the schema library is
  imported into any `domain/` (`architecture-api.md` rule 20).
- **API stack** — the environment schema validated at start-up: a missing or
  malformed value stops the process and names the field (`FR.14.1`).
- **API stack** — a committed `.env.example` listing every variable the system
  reads; no file holding real values is ever committed (`FR.14.2`).
- **Back-end** — the boundary check also fails a cross-import between sibling
  modules — `hunt` reaching into `character` — which is the shape
  `stack-api.md` rule 42's capture-group back-reference exists to express and
  neither linter can state at all (`FR.12.2`).
- **API stack** — dependency-cruiser as its own check, run from `apps/api`, with
  `tsPreCompilationDeps`, `combinedDependencies` and `exportsFields` set
  (`stack-api.md` rule 42), so type-only imports count (`FR.12.3`).
- **API stack** — CI gains type-checking and the dependency-cruiser check.

## Acceptance criteria

- [ ] `(integration)` the API boots on Fastify and resolves the client address from the forwarded header rather than from the proxy connection
- [ ] `(unit)` a missing required environment variable stops start-up with a message naming the field
- [ ] `(unit)` a malformed environment value stops start-up with a message naming the field
- [ ] `(unit)` `.env.example` lists every variable the environment schema declares, and the test fails when one is absent
- [ ] `(unit)` no committed file holds real environment values — every env file but the example is excluded by the ignore rules
- [ ] `(integration)` all five modules exist, each with the four layer folders
- [ ] `(integration)` dependency-cruiser fails on an import from `domain/` into `infrastructure/`
- [ ] `(integration)` dependency-cruiser fails on an import from one module into a sibling module
- [ ] `(integration)` dependency-cruiser fails on an outward import written as type-only
- [ ] `(integration)` CI fails when type-checking fails, and when dependency-cruiser fails

## References

- `architecture-api.md` rules 19–24 — the four layers and what may cross them.
- `stack-api.md` rules 29–33 — the workspace and the module split.
- `stack-api.md` rule 42 — dependency-cruiser and the three options it needs.
- `naming.md` rules 2, 7–9 — file suffixes, `Port`, `FooType`, use-case inputs.
- `requirements.md` `FR.9.3` (superseded by `FR.9.7`), `FR.9.7`, `FR.12.2`,
  `FR.12.3`, `FR.13.5`, `FR.14.1`, `FR.14.2`, `FR.15.5`.

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
