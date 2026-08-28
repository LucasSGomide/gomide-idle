# 04 — Postgres, Drizzle and the `server_meta` migration

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** 02

## Context

- The first database in the repository, and the test harness every later
  data-access slice reuses. The harness ships here because this is the first
  thing that needs one.
- Only the Postgres this repository needs to run its own migrations and tests.
  The **Deployment** feature (`UN.17`–`UN.20`) is a separate roadmap item.
- The `server_meta` table lives in the `system` module (`FR.9.7`).
- **Open decision, carried from the roadmap item:** `FR.10.2` seeds the build id
  in the first migration, but a build id fixed at migration time is stale on the
  next build, and no rule says where a build id comes from. A value in one shared
  row also cannot say which instance answered a request — every process reads the
  same row. Reading the build id from the process environment and seeding only a
  placeholder is the alternative to weigh. Decide it here and record the choice.
- **Open risk, carried from the roadmap item:** `drizzle-orm`/`drizzle-kit`
  `1.0.0-rc.4` is a release candidate under the persistence layer, and its
  timestamped migration folder layout is new.
- The content-pack version is seeded but never compared against the browser's —
  that gap is deliberate (`architecture-web.md` rule 32).

## Technical details

- **API stack** — `drizzle-orm` and `drizzle-kit` `1.0.0-rc.4`; `drizzle-kit`
  owns every migration in the repository (`stack-api.md` rule 17).
- **API stack** — a `docker-compose.yml` holding Postgres alone, on the engine
  version the tests use (`FR.15.1`).
- **Back-end** — the first migration: the `server_meta` table and the row seeding
  the socket protocol integer, the content-pack version and the build id
  (`FR.10.2`). Real columns throughout, no JSONB (`stack-api.md` rule 16).
- **Naming** — the Drizzle table takes its singular `snake_case` name and is
  exported as the plural camelCase symbol, in
  `system/infrastructure/database/schema/` (`naming.md` rule 11).
- **Back-end** — the Jest database harness: one Postgres container per test
  project started in `globalSetup`, a schema per worker keyed off
  `JEST_WORKER_ID`, and no `.withReuse()` (`architecture-api.md` rule 91,
  `FR.15.3`).
- **Back-end** — tests apply the project's own migrations rather than creating
  tables themselves, so the schema under test is the schema that ships
  (`FR.15.2`).
- **API stack** — CI gains the integration test project and its container.

## Acceptance criteria

- [ ] `(integration)` the migration creates `server_meta` and seeds exactly one row
- [ ] `(integration)` the seeded row carries the socket protocol integer, the content-pack version and the build id
- [ ] `(integration)` the build id the API reports identifies the running build, not the moment the migration ran
- [ ] `(integration)` the harness starts one container per test project, and not one per worker
- [ ] `(integration)` two Jest workers running concurrently read isolated schemas and neither sees the other's rows
- [ ] `(integration)` the schema under test is produced by running the project's migrations, and a test that creates a table itself fails the check
- [ ] `(integration)` the compose file and the test container run the same Postgres engine version
- [ ] `(integration)` CI runs the integration project, and fails when a migration fails

## References

- `stack-api.md` rules 16–17 — Postgres with real columns, Drizzle, `drizzle-kit`.
- `architecture-api.md` rule 91 — one container per Jest project, a schema per worker.
- `architecture-web.md` rule 32 — why the content-pack version is carried and never compared.
- `naming.md` rule 11 — the Drizzle table name and its exported symbol.
- `requirements.md` `FR.10.2`, `FR.15.1`, `FR.15.2`, `FR.15.3`, `FR.15.5`.

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
