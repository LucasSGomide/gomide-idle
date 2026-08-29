# 03 — Account sign-up and login: accounts, sessions and the first guarded screen

**Depends on:** 01, 02 · **Status:** in-progress · **Estimate:** 9

## Context

- Covers `UN.1`, `UN.2`, `UN.5` and `UN.6` in full, plus `FR.3.2` — the session
  check on the socket handshake [`01`](01-the-api-foundation.md) deliberately
  left open.
- The rest of `UN.3` and all of `UN.4` move to the **Character creation and
  selection** item, decided 2026-08-29. `FR.3.1`'s socket opens "when a character
  is selected", `FR.4.1`–`FR.4.5`'s online slot holds a character, and the
  five-second leave in `FR.2.5`, `FR.3.4` and `FR.3.5` leaves a hunt. None of the
  three exists, so writing them here means writing them twice.
- **Auth is exposed through this project's own Nest controllers**, each calling
  Better Auth's server-side `auth.api` as a function. Decided 2026-08-29, against
  the previous rule, so that auth is described by `libs/contracts` like every
  other endpoint — in the OpenAPI document, with a generated client, generated
  network fakes and declared error codes.
- That reversal was written into the rule docs before this item, in the same
  pass: [`auth.md`](../auth.md) rules 3 and 19 reversed, rules 4, 17, 23 and 27
  and gotchas 30, 34 and 35 rewritten, [`stack-api.md`](../stack-api.md) rule 39
  reversed and [`stack-web.md`](../stack-web.md) rules 58 and 59 with it.
- Its one real cost is the rate limiter. Better Auth does not rate-limit calls
  made through `auth.api`, so `FR.5.1` becomes one `@nestjs/throttler` guard of
  ours carrying both keys — which is fewer moving parts than the two mechanisms
  it replaces, not more.
- `player_account` is **not** created here, decided 2026-08-29. `FR.7.2` and
  `FR.7.3` belong to **Language and localisation**, and until then the signed-in
  switcher writes `localStorage` alone exactly as the signed-out one has since
  [`02`](02-the-web-foundation.md). The switcher gains a second write path later;
  nothing is rewritten.
- `02` reserved `/`'s body for this item and kept the footer persistent. `/`
  becomes the sign-in screen and the footer stays.

## User Experience:

- **Entry** — `/`, the sign-in screen, filling the empty body `02` left. A player
  who already has a session is redirected to `/characters`.
- **Entry** — `/sign-up`, its own route, linked from sign-in. Same redirect when a
  session already exists.
- **Entry** — any route under `_authed` reached without a session redirects to `/`
  carrying the target in a search param, and sign-in returns the player there.
- **Flow** — sign-up takes an e-mail and a password, creates the account, signs
  the player in and lands on `/characters`. Sign-in takes the same two fields and
  lands on the search param's target, or `/characters`.
- **Flow** — the signed-in top bar's account menu holds the language switcher and
  the sign-out control; signing out returns to `/` and closes that session's
  socket, leaving another device's alone.
- **States** — pending: the submit button swaps its label for a spinner at the
  same size and never resizes. Field errors put `danger` on the border and helper
  text with a trailing icon.
- **States** — duplicate e-mail, wrong credentials, too many attempts and
  registration closed each carry their own error `code` and render through the
  catalogue, never from the server's message. With registration
  closed, `/sign-up` still resolves and renders the closed notice in place of the
  form, and sign-in hides the link.
- **Pattern** — forms are `design.md` §5's Inputs and Buttons and §8's error
  states, unchanged; the signed-in top bar is §1's Character-select row
  ([`design.md:54`](../design.md)) and the in-menu switcher is §13's signed-in
  control ([`design.md:675`](../design.md)).

## Key Areas:

- **Auth** — Better Auth behind our own controllers, one global session guard
  with a public decorator, ownership-scoped reads, one 401 handler;
  `auth.md` rules 1–5, 11–13, 15–16, 18, 20–28, 31–33, gotchas 29, 30, 34.
- **Back-end** — the `auth` module's four inward-only layers and controllers that
  decide nothing; `architecture-api.md` rules 19–24, 37, 40.
- **API stack** — Better Auth 1.7.2 on the Drizzle adapter, `@nestjs/throttler`'s
  two named throttlers, the handshake session read; `stack-api.md` rules 26–28,
  38–39.
- **Front-end** — `_authed.tsx` as the only guard, `features/session/` as the
  only session reader, no feature importing a feature; `architecture-web.md`
  rules 6–13, 22, 27, 33.
- **Web stack** — generated hooks and MSW handlers now covering auth, the
  `localStorage` language mirror unchanged, the dev server on one origin;
  `stack-web.md` rules 39, 52–53, 57–59, 61–62.
- **Design** — §1's Character-select top bar, §5's Inputs and Buttons, §8's error
  and loading states, §13's in-menu switcher; every control sized against the
  Portuguese string.

## Technical Details:

1. Install `better-auth` in `apps/api` and build the instance in
   `auth/infrastructure/`: Drizzle adapter, e-mail and password on, no mail
   sender, verification and reset switched off, password bounds pinned to 8–128,
   session `expiresIn` 30 days with the refresh window extending it on activity.
2. Add the `api-auth-schema` target to the `Makefile` — `auth.md`'s Commands
   table names it and nothing defines it — then run it into the auth module's
   Drizzle schema, commit the generated file unedited, and produce the migration
   with `drizzle-kit`.
3. Write the auth schemas in `libs/contracts` — sign-up, sign-in, sign-out and
   session, request and response — naming each OpenAPI component the way `01`'s
   `As built` settled for `serverMetaResponseSchema` rather than assuming a
   top-level `.meta({ id })` survives `cleanupOpenApiDoc`.
4. Add the four use cases in `auth/application/` and one `@Controller('auth')` in
   `auth/entrypoint/` — `POST sign-up`, `POST sign-in`, `POST sign-out`,
   `GET session` — each calling `auth.api.*` and copying the library's
   `set-cookie` onto the Fastify reply.
5. Add a code to `libs/contracts`'s `ERROR_CODES` for each auth failure and
   translate the library's error into it in the controller: duplicate e-mail
   (`FR.1.4`), bad credentials, too many attempts, registration closed. Each
   names the situation and never the status (`naming.md` rule 15) —
   `EMAIL_TAKEN`, not `CONFLICT`; `assertSituationCode` rejects the second.
6. Add the session guard over `auth.api.getSession`, register it globally in the
   app module, and mark sign-up, sign-in and `01`'s `server-meta` public with one
   decorator.
7. Add the registration switch to the environment schema, refuse sign-up with the
   closed code when it is off, and return the flag on `GET auth/session` so the
   web can hide the link rather than guess.
8. Add `@nestjs/throttler` with two named throttlers on sign-in — one `getTracker`
   returning the source address, one the submitted e-mail — and confirm Fastify's
   `trustProxy` is on, or the first key is the proxy for every player at once.
9. Read the session at the socket handshake and store its id on the connection;
   refuse a handshake with no session using a `NO_SESSION` code rather than a
   bare disconnect; close a session's connections when that session is deleted.
   Replace the gateway's `cors: { origin: true }` with the `Origin` check
   `stack-api.md` rule 38 requires — as it stands it reflects whatever origin
   asks.
10. Regenerate and verify the loop closed: emit the OpenAPI document, run Orval,
    and confirm the auth hooks, client and MSW handlers are generated — no
    hand-written auth client is left anywhere.
11. Add Vite's `server.proxy` for `/api` and the socket path per `stack-web.md`
    rule 62, so `make dev-all` serves the web and the API from one origin. Until
    it exists the relative `/api` in `lib/api/fetcher.ts` resolves to Vite's own
    origin and no request reaches Nest at all.
12. Build `features/session/` over the generated hooks, `_authed.tsx` resolving
    the session in `beforeLoad` and redirecting with the target search param, and
    `_authed/characters.tsx` rendering the signed-in top bar over an empty body.
13. Build `/` and `/sign-up` from the generated mutation hooks, add the single 401
    handler to the fetch mutator, and add both catalogues' entries for every new
    error code, form label and helper string.

### Technical References:

- `auth.md` rules 3, 19 — reversed 2026-08-29; our own controllers, in the
  document.
- `auth.md` rule 17 and `stack-api.md` rule 39 — one throttler guard, two keys.
- `auth.md` rules 5, 15–16, 18, 31 — schema generation, no mail, closed
  registration, the 30-day sliding session.
- `auth.md` rules 11–13, 20–22 — the global guard, the user id as use-case input,
  ownership-scoped reads and one `NOT_FOUND`.
- `auth.md` rules 4, 23–28 — the web side, rewritten in the same pass.
- `auth.md` rules 32–33 — read the session once at the handshake; a delete closes
  that session's sockets.
- `auth.md` gotchas 29, 30, 34, 35 — cookie and `credentials`, jsdom's missing
  cookie, `trustProxy`, and why the body parser stays on.
- `stack-api.md` rules 26–28 — Better Auth, sessions in our Postgres, no
  community Nest adapter.
- `stack-api.md` rule 38 — the handshake session check and the `Origin` check.
- `stack-api.md` rule 35 — the online slot, deferred with `UN.4`.
- `stack-web.md` rules 39, 52–53, 57–59, 61 — `_authed.tsx`'s name, the language
  mirror, generated hooks, MSW, and no Better Auth on the web.
- `architecture-web.md` rules 22, 27, 33 — one guard, render from the code, who
  may read the session.
- `architecture-api.md` rules 19–24, 37, 39, 40 — the layers, the two error
  categories, the one `code` vocabulary in `libs/contracts`, and refusing a
  second error type.
- `design.md` §1 ([`design.md:54`](../design.md)), §5, §8 and §13
  ([`design.md:675`](../design.md)).
- `naming.md` rules 14–15 — `account` is Better Auth's generated table and the
  game's word for a person is player; an error `code` spells the situation and
  never the HTTP status.
- `stack-web.md` rule 62 — the dev server proxies `/api`, so development is one
  origin like the deployment.

## Blockers:

- `auth.md` rule 3 was reversed on 2026-08-29 and nothing in this repository has
  run it. The controller depends on `auth.api.signInEmail(…, { asResponse: true })`
  handing back the `set-cookie` the library would have written; if it does not,
  the header has to be lifted with `returnHeaders` instead, and Technical Detail 4
  decides which.
- Better Auth's `Origin` check lives in the HTTP handler rule 3 no longer mounts.
  `stack-api.md` rule 48's single origin removes the cross-site case for HTTP, but
  `stack-api.md` rule 38 still requires the check on every socket connection and
  nothing performs it: `system.gateway.ts` is
  `@WebSocketGateway({ cors: { origin: true } })`, which reflects whatever origin
  asks. Technical Detail 9 replaces it, and what the allowed list holds in
  development — where `stack-web.md` rule 62's proxy is the only origin — is
  decided there.
- `@nestjs/throttler` appears nowhere in `apps/api/package.json` and
  `stack-api.md` rule 39 named it only on 2026-08-29. Two named throttlers, one of
  them reading the submitted e-mail out of the request body inside a guard, is
  unexercised here.
- `auth.md` rule 33 closes a session's sockets, but the only gateway in the
  repository is `apps/api/src/modules/system/entrypoint/system.gateway.ts` and it
  belongs to `system`. Which module owns the session-id-to-connection map, and
  whether `system` may depend on `auth` for it, is undecided.
- `01`'s `As built` records that a top-level `.meta({ id })` collides with
  `cleanupOpenApiDoc`'s own hoist, so `serverMetaResponseSchema` carries none. The
  four auth DTOs meet the same constraint, and `stack-api.md` rule 47 still asks
  every reusable schema to be explicitly named.
- Nothing in this repository has ever made a browser request from the web to the
  API, so the whole transport is unexercised. `lib/api/fetcher.ts` holds a
  relative `/api`, the API enables no CORS, `vite.config.ts` has no proxy, and
  `docker-compose.yml` runs Postgres alone — `stack-api.md` rule 48's Caddy is
  Deployment work (`UN.17`–`UN.20`) and is not written. `02` never found this
  because its footer read `server_meta` through MSW in tests and `/` rendered
  nothing in the browser. Technical Detail 11 and `stack-web.md` rule 62 are the
  answer; this item is the first to find out whether they are enough.

- The two items this one defers to do not exist yet. `UN.3`'s remainder and all
  of `UN.4` go to **Character creation and selection**, and `FR.7.2`–`FR.7.3` to
  **Language and localisation**; both are still `TODO` rows in
  `requirements.md` with no roadmap doc of their own. `make roadmap-check`
  validates numbered dependencies only, so nothing will notice if either
  deferral is never picked up.

- `FR.2.2`'s sliding expiry has no test tier that can advance thirty days.
  `apps/api/test/integration` runs against real Postgres, so renewal is checkable
  only by writing an expiry directly and asserting the guard's behaviour either
  side of it.
