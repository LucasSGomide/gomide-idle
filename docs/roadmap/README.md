# Roadmap

Committed work. One doc per item, numbered on creation — **the number is a
permanent ID, never renumbered**. Ordering lives in this table only.

**Rules**

- Every table below is generated from the docs' metadata headers (`Depends on` /
  `Status` / `Estimate`). **Edit the doc, not the table.**
- Sections: **Ready** (every dependency `done`, not yet finished) first, then
  **Blocked**, each by estimate desc, ties by number asc. Then **Parked**.
  **Done** last, sorted by number asc.
- `Depends on` is roadmap numbers only. `—` means nothing blocks it.
- Status: `not-started` · `in-progress` · `parked` · `done`. Derived from the
  item's task checkboxes whenever a breakdown is open.
- The prose above the table is hand-written and says **why** the next item is
  next. The table sorts by estimate; that sort is not a priority.

**Pick up [03](03-account-sign-up-and-login.md).** [01](01-the-api-foundation.md)
and [02](02-the-web-foundation.md) shipped the API and web foundations end to end
— the pnpm workspace, both stacks, the normalised error and log shapes, and the
`server_meta` path from Postgres to a rendered screen. `02` deliberately left `/`
as the shell over an empty body for `03` to fill, and `01` left the socket
handshake unauthenticated for `03` to check, so `03` is the item those two were
shaped around. It is also the gate: every feature after it belongs to somebody.

**Deployment** (`requirements.md` `UN.17`–`UN.20`) is still referenced and not yet
written. It does not block `03` — `01` already ships the Postgres this repository
needs to run its own migrations and tests.

## Ready

| # | Item | Est | Depends on | Status |
|---|---|---|---|---|
| [03](03-account-sign-up-and-login.md) | Account sign-up and login: accounts, sessions and the first guarded screen | 9 | 01, 02 | not-started |

## Blocked

_(none)_

## Parked

_(none)_

## Done

| # | Item | Est | Depends on | Status |
|---|---|---|---|---|
| [01](01-the-api-foundation.md) | The API foundation: workspace, contract and the server's half of the first path | 10 | — | done |
| [02](02-the-web-foundation.md) | The web foundation: shell, design system and the first rendered screen | 9 | 01 | done |
