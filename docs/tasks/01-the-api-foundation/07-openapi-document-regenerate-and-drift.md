# 07 — The OpenAPI document, the regenerate command and the drift check

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** 05, 06

## Context

- The last slice of the item, and the one roadmap item `02` waits on: every web
  step needs this document before it can generate a client, a query hook or a
  network fake (`FR.11.3`).
- It ships last because the document is only worth committing once every route
  and schema it describes exists — the read path from task `05` and the
  handshake schema from task `06`.
- `FR.11.2` is the constraint that shapes the whole slice: generating the
  document must need nothing running. Preview mode opens no port and connects to
  no database, so a fresh clone can regenerate before it can boot.
- `UN.11` is about generated code that cannot silently disagree with its source.
  Committing the output is half of that; the CI drift check is the half that
  makes it true.

## Technical details

- **API stack** — emit the OpenAPI document by booting the API with
  `preview: true` and running `cleanupOpenApiDoc` (`stack-api.md` rule 46,
  `FR.11.2`).
- **API stack** — commit the generated document (`FR.11.5`).
- **API stack** — every reusable schema and every enum carries an explicit name,
  which `.meta({ id })` in tasks `05` and `06` supplies (`FR.11.4`).
- **API stack** — one command regenerating every generated file, so a fresh clone
  type-checks after a single step rather than failing in a way that looks like
  broken code (`FR.11.6`).
- **API stack** — CI regenerates and fails on any difference (`FR.11.5`,
  `FR.15.5`).

## Acceptance criteria

- [ ] `(integration)` generating the document opens no port and connects to no database
- [ ] `(integration)` every reusable schema and enum in the document carries an explicit name, and none is named after its position
- [ ] `(integration)` the committed document is byte-identical to a fresh generation
- [ ] `(integration)` the regenerate command produces every generated file from a clean clone in one step, after which the repository type-checks
- [ ] `(integration)` CI fails when the committed document differs from a regeneration

## References

- `stack-api.md` rule 46 — `preview: true` and `cleanupOpenApiDoc`.
- `stack-api.md` rule 47 — `.meta({ id })` and why the names matter downstream.
- `requirements.md` `UN.11`, `FR.11.1`–`FR.11.6`, `FR.15.5`.

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
