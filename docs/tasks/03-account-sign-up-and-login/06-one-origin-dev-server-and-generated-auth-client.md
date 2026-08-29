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
- **Web stack** — the generated MSW handlers now cover auth, so the suite keeps
  running with no live API; `stack-web.md` rules 52–53.
- **Back-end** — nothing is added to the API for CORS. One origin is the answer;
  `stack-api.md` rule 48.

## Acceptance criteria

- [ ] `(e2e)` with `make dev-all` running, loading `/` in the browser renders the footer's build identifier from a request that reached Nest
- [ ] `(e2e)` the socket path proxies through Vite and the handshake reaches the gateway from the dev origin without being refused
- [ ] `(e2e)` with the API stopped, the footer renders `design.md` §8's error state rather than a blank or a crashed shell
- [ ] `(integration)` regenerating leaves `apps/api/openapi.json` and Orval's output byte-identical, so the drift check holds in `make check`
- [ ] `(unit)` a generated hook, client function and MSW handler exists for each of the four auth endpoints
- [ ] `(unit)` no file under `apps/web/src` imports `better-auth` or hand-writes an auth request
- [ ] `(unit)` the footer's existing specs still pass against the regenerated MSW handlers

## References

- `stack-web.md` rule 62 — the dev server proxies `/api`, so development is one
  origin like the deployment.
- `stack-web.md` rules 57–59 — generated hooks, the generated client, and no
  Better Auth on the web.
- `stack-web.md` rules 52–53 — MSW as the network fake.
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
