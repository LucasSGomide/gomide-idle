# 01 — The API foundation: workspace, contract and the server's half of the first path

Sliced so each task leaves the repository green on its own. Task `01` is the
workspace and the lint gate; `02` brings up the app and the boundary checker that
polices it; `03` and `04` are the two foundations every feature sits on — the
error and log shapes, and Postgres with its test harness — and are independent of
each other. `05` and `06` are the two halves of `UN.10`'s proof, HTTP and socket.
`07` publishes the document roadmap item `02` is blocked on, and goes last
because it can only describe routes that already exist.

The CI workflow is created in `01` and extended by `02`, `04` and `07` rather
than rewritten.

| # | Task | Scope | Depends on | Criteria | Status |
|---|---|---|---|---|---|
| [01](01-pnpm-workspace-and-lint-gate.md) | The pnpm workspace, the library packages and the lint gate | back-end | — | 0/7 | not-started |
| [02](02-api-app-boots-with-validated-environment.md) | The API app boots on Fastify with a validated environment | back-end | 01 | 0/8 | not-started |
| [03](03-error-shape-log-shape-and-observability.md) | The normalised error shape, the log shape and observability | back-end | 02 | 0/8 | not-started |
| [04](04-postgres-drizzle-and-the-server-meta-migration.md) | Postgres, Drizzle and the `server_meta` migration | back-end | 02 | 0/8 | not-started |
| [05](05-the-server-meta-read-path.md) | The `server_meta` read path, port to controller | back-end | 03, 04 | 0/7 | not-started |
| [06](06-socket-handshake-and-its-error-twin.md) | The socket handshake and its error twin | back-end | 03 | 0/6 | not-started |
| [07](07-openapi-document-regenerate-and-drift.md) | The OpenAPI document, the regenerate command and the drift check | back-end | 05, 06 | 0/5 | not-started |
