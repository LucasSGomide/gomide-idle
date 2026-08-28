# 05 — The `server_meta` read path, port to controller

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** 03, 04

## Context

- The server's half of `UN.10`'s proof that every layer connects. Roadmap item
  `02` completes the path in the browser; `FR.10.1` is met only across both.
- `FR.10.4` forbids a throwaway fixture on this path, and there is none: the
  protocol integer is `stack-api.md` rule 15's permanent socket version, and the
  other two values are diagnostics the alpha keeps.
- It lives in the `system` module created in task `02` (`FR.9.7`). `server_meta`
  belongs to the running server rather than to any game system.
- A **DAO**, not a repository: this is a read with no aggregate behind it, and
  `architecture-api.md` rule 21 reserves the repository for the domain boundary.
- These are the repository's **first** DAO, first port, first injection token and
  first use case. `naming.md` rules 7, 10 and 12 are being set by example here,
  and a wrong one is copied by every item after this.
- **Considered, not committed:** `system` is where server-wide toggles would
  later land — feature flags for live events, a maintenance-mode switch, kill
  switches. Nothing in `requirements.md` asks for any of it and none of it is in
  this slice; each would arrive as its own user need. The reasoning, and what the
  existing rules already constrain about it, is in
  [`explorations/05`](../../explorations/05-server-wide-toggles.md).

## Technical details

- **API stack** — the `server_meta` response schema in `libs/contracts` as the
  single source for request validation, the OpenAPI document and the socket
  message types (`FR.11.1`), carrying `.meta({ id })` so no generated type is
  named after its position (`stack-api.md` rule 47, `FR.11.4`).
- **Naming** — `GetServerMetaDaoPort` in `system/application/`
  (`naming.md` rules 2, 7).
- **Naming** — `GetServerMetaDao` in
  `system/infrastructure/database/dao/get-server-meta.dao.ts`; the ORM does not
  appear in the name (`naming.md` rule 10).
- **Naming** — the `GET_SERVER_META_DAO` injection token, named after the port it
  satisfies (`naming.md` rule 12).
- **Back-end** — one use case with a single public `execute` taking a
  `<Verb><Resource>InputType` (`architecture-api.md` rule 25, `naming.md` rule 9).
- **Back-end** — an HTTP controller in `system/entrypoint/` that decides nothing,
  so a socket handler could call the same use case
  (`architecture-api.md` rule 24).
- **Back-end** — no Drizzle inferred row type escapes the data-access layer
  (`architecture-api.md` rule 22).

## Acceptance criteria

- [ ] `(e2e)` the endpoint returns the seeded protocol integer, content-pack version and build id, read from real Postgres through Drizzle
- [ ] `(integration)` the DAO returns its own shape, and no Drizzle inferred row type is exported from the data-access layer
- [ ] `(unit)` the use case depends on `GetServerMetaDaoPort` and not on the DAO implementation
- [ ] `(unit)` the controller maps request to use-case input and result back, and makes no decision of its own
- [ ] `(integration)` the response validates against the `libs/contracts` schema
- [ ] `(unit)` the response schema carries an explicit `.meta({ id })`
- [ ] `(unit)` the injection token's name matches the port it satisfies
- [ ] `(unit)` the port is suffixed `Port` in a `.port.ts` file and the implementation is `GetServerMetaDao` in `get-server-meta.dao.ts`, with the ORM named in neither
- [ ] `(unit)` the use case exposes one public `execute`, taking a `GetServerMetaInputType`

## References

- `architecture-api.md` rules 21–22, 24–25 — the repository boundary, the row
  type that must not escape, the decision-free entrypoint, the use case.
- `stack-api.md` rule 15 — the protocol integer the client hard-codes.
- `stack-api.md` rule 47 — `.meta({ id })` on every reusable schema.
- `naming.md` rules 2, 7, 9, 10, 12 — file suffix, `Port`, use-case input, DAO,
  injection token.
- `architecture-web.md` rule 32 — why the content-pack version is carried and
  never compared.
- `requirements.md` `UN.10`, `FR.10.1`, `FR.10.2`, `FR.10.4`, `FR.11.1`,
  `FR.11.4`, `FR.9.7`.

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
