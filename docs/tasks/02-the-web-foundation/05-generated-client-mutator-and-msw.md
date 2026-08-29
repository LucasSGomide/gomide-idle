# 05 — The generated client, the fetch mutator and the network fake

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** 01

## Context

- The input is the OpenAPI document roadmap item `01` commits. The client, the
  query hooks and the test fakes are all generated from it; none of the three is
  hand-written.
- The mutator is the one exception, written once and holding the relative base
  path and `credentials`, so no feature ever configures a client and nothing about
  the host is compiled in.
- Orval's version floor is 8.0.2 because of the three traps `stack-web.md` rule 61
  records.
- `stack-web.md` rule 58 leaves `/api/auth/*` hand-written and outside the
  document. Nothing in this item touches those routes, so that one part of the
  network fake ships unexercised — a known gap, not an oversight.
- Nothing renders in this slice; the footer in task `06` is the first consumer.

## User experience

- **States** — nothing renders. This slice ships the generated client and its
  network fake; the footer that consumes them arrives in task `06`.

## Technical details

- **Web stack** — run Orval 8.0.2 or later against `01`'s committed document into
  `lib/` — fetch client, TanStack Query hooks, and MSW handlers via
  `mock: { generators: [{ type: 'msw' }] }`; `stack-web.md` rules 57–58, 61.
- **Front-end** — write the fetch mutator once, holding the relative base path and
  `credentials`; `architecture-web.md` rule 11.
- **Web stack** — extend `01`'s regenerate command to cover Orval's output, commit
  it, and fail CI on a difference.
- **Web stack** — Vitest fakes the network at the network boundary with the
  generated handlers, never by mocking a module; `stack-web.md` rules 41, 57.

## Acceptance criteria

- [x] `(integration)` regenerating from the committed document reproduces the committed client, hooks and handlers exactly
- [x] `(integration)` CI fails when the committed document changes and Orval's output is not regenerated
- [x] `(unit)` every generated request goes through the single mutator
- [x] `(unit)` the mutator sends a relative base path and `credentials` on every call, with no host compiled into the client
- [x] `(integration)` a Vitest test using the generated MSW handlers resolves a typed response with no live server and no module mock

## References

- `stack-web.md` rules 57–58, 61 — the generated hooks, MSW, and Orval 8's three
  traps.
- `stack-web.md` rules 41, 44 — Vitest, and jsdom only where something renders.
- `architecture-web.md` rules 11, 6–13 — the single mutator, the six folders and
  the import rules.
- `design.md` — the visual system this slice renders nothing into, cited because
  the scope is front-end.
- `requirements.md` `FR.11.3` — the client, the hooks and the fakes are generated;
  none of the three is hand-written.
- `requirements.md` `FR.11.6` — one command regenerates all of them.
- `requirements.md` `FR.14.3` — no runtime configuration; same-origin relative
  paths.
- `requirements.md` `FR.15.4` — fakes at the network boundary, never a module mock.

## Implement with

`/web-feature`
