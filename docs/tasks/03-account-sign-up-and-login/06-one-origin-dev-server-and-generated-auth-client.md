# 06 — One origin in development, and the generated auth client

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** full-stack · **Depends on:** 02, 03, 05

## Context

- Nothing in this repository has ever made a browser request from the web to the
  API. `lib/api/fetcher.ts` holds a relative `/api`, the API enables no CORS,
  `vite.config.ts` has no proxy, and `docker-compose.yml` runs Postgres alone.
- [`02`](../../roadmap/02-the-web-foundation.md) never found this: its footer read
  `server_meta` through MSW in tests and `/` rendered nothing in the browser. This
  slice is the first to find out whether `stack-web.md` rule 62's proxy is enough.
- `stack-api.md` rule 48's Caddy is Deployment work (`UN.17`–`UN.20`) and is not
  written. The dev proxy is the development equivalent of that one origin, which
  is why no CORS is added to the API instead.
- It depends on `05` because one origin means both paths: the socket proxies
  through the same Vite server the `Origin` check now inspects.
- There is no browser harness in this repository. `(e2e)` here means an
  in-process Nest app over real Postgres
  (`apps/api/test/integration/*.e2e.spec.ts`) and the web runs vitest in jsdom,
  so the proxy is asserted from its config and the one thing only a browser can
  confirm is left as a single `(manual)` line.
- The screens come next. This slice renders nothing new — it makes the existing
  footer reach real Nest, and generates the client the two screens are built on.

## User experience

- **Entry** — no new screen. `/` is still `02`'s shell over an empty body and
  `/sign-up` does not exist yet.
- **States** — the footer's build identifier now renders from the running API in
  the browser, where before it resolved only from MSW in tests.
- **States** — the footer's existing loading and error states are unchanged, and
  a stopped API renders the error state rather than a blank footer.
- **Pattern** — unchanged: `02`'s footer and `design.md` §8's error and loading
  states.

## Technical details

- **Web stack** — add Vite's `server.proxy` for `/api` and for the socket path,
  so `make dev-all` serves the web and the API from one origin;
  `stack-web.md` rule 62.
- **Web stack** — emit the OpenAPI document and run Orval through the existing
  `make gen-open-api` and `make generate`, and confirm the auth hooks, client
  functions and MSW handlers are generated; `stack-web.md` rules 57–59.
- **Front-end** — no hand-written auth client is left anywhere, and no Better
  Auth on the web; the generated client goes through `lib/api/fetcher.ts` as it
  stands, whose `credentials: 'include'` is already what the cookie needs
  (`auth.md` rule 4, gotcha 29).
- **Web stack** — Orval stays pinned at 8.0.2 or later, asks for MSW handlers as
  `mock: { generators: [{ type: 'msw' }] }` rather than `mock: true`, and emits a
  fetch client rather than axios; `stack-web.md` rule 61. Below 8.0.2 the
  *generated client* carries CVE-2026-23947, and `credentials: 'include'` is a
  fetch option that would not exist on an axios one.
- **Web stack** — the generated MSW handlers now cover auth, so the suite keeps
  running with no live API; `stack-web.md` rules 52–53.
- **Back-end** — nothing is added to the API for CORS. One origin is the answer;
  `stack-api.md` rule 48.

## Acceptance criteria

- [ ] `(unit)` `vite.config.ts` proxies `/api` to the API's port, so the relative `/api` in `lib/api/fetcher.ts` resolves to Nest rather than to Vite's own origin
- [ ] `(unit)` `vite.config.ts` proxies the socket path with `ws: true`, so the handshake reaches the gateway on the dev origin the allowed list holds
- [ ] `(unit)` a footer whose request fails renders `design.md` §8's error state from the error's `code`, rather than a blank or a crashed shell
- [ ] `(integration)` regenerating leaves `apps/api/openapi.json` and Orval's output byte-identical, so the drift check holds in `make check`
- [ ] `(unit)` a generated hook, client function and MSW handler exists for each of the four auth endpoints
- [ ] `(unit)` Orval is pinned at 8.0.2 or later and its config asks for MSW handlers alone with fetch as the HTTP client
- [ ] `(unit)` no file under `apps/web/src` imports `better-auth` or hand-writes an auth request
- [ ] `(unit)` the footer's existing specs still pass against the regenerated MSW handlers
- [ ] `(manual)` with `make dev-all` running, `/` in a real browser renders the footer's build identifier from a request that reached Nest — the repository has no browser harness, so this one confirmation is by hand and everything under it is asserted from config above

## References

- `stack-web.md` rule 62 — the dev server proxies `/api`, so development is one
  origin like the deployment.
- `stack-web.md` rules 57–59 — generated hooks, the generated client, and no
  Better Auth on the web.
- `stack-web.md` rules 52–53 — MSW as the network fake.
- `stack-web.md` rule 61 — Orval pinned at 8.0.2 or later for CVE-2026-23947,
  MSW handlers asked for explicitly, and fetch rather than axios.
- `stack-api.md` rule 48 — one origin; the Caddy that provides it in production
  is Deployment work.
- `auth.md` rule 4 — the web talks to our endpoints, not to the library.
- `auth.md` gotchas 29, 30 — the cookie and `credentials`, and jsdom's missing
  cookie.
- `architecture-web.md` rule 11 — `lib/api/fetcher.ts` is the one file the
  generated client calls.
- `design.md` §8 — the error and loading states the footer already uses.
- `apps/web/vite.config.ts` and `apps/web/src/lib/api/fetcher.ts` — the proxy's
  absence and the relative `/api` as they stand.

## Implement with

`/web-feature`
