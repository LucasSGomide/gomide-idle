# 06 — The error boundary, the error catalogue and the footer

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** 04, 05

## Context

- This is where `UN.10`'s end-to-end path visibly completes: a route renders
  values fetched by a generated hook from `01`'s endpoint, which read Postgres
  through Drizzle.
- The footer is a **New pattern**. Nothing in [`design.md`](../../design.md)
  describes a footer at all — §1 ends at the top bar and the live-hunt column — so
  its height, placement and type scale are decided in this slice, and the design
  doc owes a rule once it ships.
- The error boundary and the footer land together because the footer's error state
  is the boundary's first and only exercise in this item. Shipping the boundary
  alone would ship something nothing proves.
- The catalogue keys off `SCREAMING_SNAKE_CASE` error codes. The server's
  `message` is never rendered.

## User experience

- **Flow** — the footer's three values arrive from the generated hook after the
  shell is already on screen.
- **States** — pending: no footer line and no spinner. The shell is the page.
- **States** — error: the footer renders the error's `code` through the catalogue,
  never the server's `message`.
- **States** — a route's subtree throwing renders the boundary's block in place
  of that region alone; the top bar and the footer stay on screen. The
  application-root boundary renders the same block full-width, with the bar
  still drawn.
- **New pattern** — a persistent footer carrying the protocol, content-pack and
  build values. Nothing in [`design.md`](../../design.md) describes a footer; the
  design doc owes a rule once this ships.

## Technical details

- **Front-end** — add the error boundary at the application root and on every
  route; `architecture-web.md` rules 27, 32.
- **Front-end** — render an error from its `code` through the catalogue, never the
  server's `message`; `architecture-web.md` rule 27.
- **Naming** — the catalogue keys off the `SCREAMING_SNAKE_CASE` error codes;
  `naming.md` rule 15.
- **Front-end** — build the footer from the generated hook, with the pending and
  error states above, and no content-pack version check;
  `architecture-web.md` rule 32.
- **Design** — the footer's height, placement and type scale are decided here and
  sized against the Portuguese string.

## Acceptance criteria

- [x] `(e2e)` `/` renders the protocol, content-pack and build values fetched by the generated hook
- [x] `(unit)` while the query is pending the footer renders no line and no spinner, and the shell is the whole page
- [x] `(unit)` an error response renders the catalogue entry for its `code`, and the server's `message` appears nowhere in the document
- [x] `(unit)` an unrecognised error `code` renders a generic catalogue entry rather than the raw code
- [x] `(unit)` a component throwing under a route renders the boundary's block in place of that region alone, with the top bar and the footer still on screen
- [x] `(unit)` a throw outside every route renders the same block full-width, with the top bar still drawn and no blank page
- [x] `(unit)` no content-pack version check runs anywhere on the footer's path
- [x] `(unit)` the footer renders its Portuguese strings without truncation at the narrowest supported width

## References

- `architecture-web.md` rules 11, 27, 32 — the single mutator, rendering an error
  from its code, and no content-pack version check.
- `naming.md` rule 15 — the `SCREAMING_SNAKE_CASE` error codes the catalogue keys
  off.
- `stack-web.md` rules 57–58 — the generated hooks and MSW.
- `design.md` §1 ([`design.md:27`](../../design.md)) — the top bar and the
  live-hunt column, where the specification stops and this footer begins.
- `requirements.md` `FR.10.1` — one path runs end to end: a web route renders data
  fetched by a generated hook from an API endpoint that reads Postgres.
- `requirements.md` `FR.13.3` — the web renders an error from its `code` through
  the catalogue, never from the server's message.
- `requirements.md` `FR.16.5` — an error boundary at the application root and on
  every route, so a broken screen never renders as a blank page.

## Implement with

`/web-feature`
