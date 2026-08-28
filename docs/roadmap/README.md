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

**Next up: [01](01-the-api-foundation.md).** The repository is documentation
and nothing else, so 01 writes its first line of code and every other item
waits on it. [02](02-the-web-foundation.md) is blocked on the OpenAPI document
01 produces, and the **Deployment** feature (`requirements.md` `UN.17`–`UN.20`)
still has no item.

## Ready

| # | Item | Est | Depends on | Status |
|---|---|---|---|---|
| [01](01-the-api-foundation.md) | The API foundation: workspace, contract and the server's half of the first path | 10 | — | not-started |

## Blocked

| # | Item | Est | Depends on | Status |
|---|---|---|---|---|
| [02](02-the-web-foundation.md) | The web foundation: shell, design system and the first rendered screen | 9 | 01 | not-started |

## Parked

_(none)_

## Done

_(none)_
