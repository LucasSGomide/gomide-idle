# 04 — Rate-limiting sign-in, by address and by account

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** back-end · **Depends on:** 02

## Context

- `FR.5.1`: sign-in attempts are rate-limited per source address *and* per
  account. Better Auth does not rate-limit calls made through `auth.api`, so this
  is one `@nestjs/throttler` guard of ours carrying both keys — fewer moving
  parts than the two mechanisms it replaces, not more.
- `@nestjs/throttler` appears nowhere in `apps/api/package.json` and
  `stack-api.md` rule 39 named it only on 2026-08-29. Two named throttlers, one
  of them reading the submitted e-mail out of the request body inside a guard, is
  unexercised here — which is why this is its own slice rather than part of `02`.
- `TOO_MANY_ATTEMPTS` was added to `ERROR_CODES` in task `02`. This slice is the
  first to throw it.
- `FR.5.3`: the counters live in process memory, which is correct only while the
  API runs as a single process. That constraint is recorded, not solved here.
- If Fastify's `trustProxy` is off, the address key is the proxy for every player
  at once — one player tripping the limit locks out everybody (`auth.md`
  gotcha 34).

## Technical details

- **API stack** — add `@nestjs/throttler` to `apps/api` and configure two named
  throttlers; `stack-api.md` rule 39, `auth.md` rule 17.
- **Auth** — one throttler's `getTracker` returns the source address; the other's
  returns the e-mail submitted in the request body, falling back to the address
  when the body carries none.
- **Auth** — the guard applies to `POST auth/sign-in` only. Sign-up, sign-out and
  the session read are untouched by it.
- **API stack** — confirm Fastify's `trustProxy` is on, or the address tracker
  collapses to the proxy for every request; `auth.md` gotcha 34.
- **Back-end** — the throttler's rejection is translated into the project's error
  body carrying `TOO_MANY_ATTEMPTS`, never the library's own message or a second
  error shape; `architecture-api.md` rules 39–40.
- **Back-end** — record `FR.5.3`'s single-process constraint next to the
  configuration, so a second process is not added without shared storage first.

## Acceptance criteria

- [x] `(integration)` sign-in attempts from one address past the limit return `TOO_MANY_ATTEMPTS`, and an attempt under the limit still succeeds
- [x] `(integration)` attempts against one e-mail past the limit return `TOO_MANY_ATTEMPTS` even when each arrives from a different source address
- [x] `(integration)` a throttled sign-in returns the project's error body with a `code` and no `@nestjs/throttler` default message
- [x] `(unit)` the e-mail tracker reads the submitted e-mail, and falls back to the source address when the body has none
- [x] `(integration)` `POST auth/sign-up` and `GET auth/session` are refused by neither key
- [x] `(unit)` `trustProxy` is enabled on the Fastify adapter, so a forwarded address reaches the address tracker rather than the proxy's own

## As built

- **The rate limit is a guard of ours, not `@nestjs/throttler`.** That package
  tops out at 6.5.0, which is CJS-only, peers `@nestjs/common` `<=11`, and its
  `require()` of NestJS 12's ESM `@nestjs/common` throws a `require(esm)` cycle
  under Jest's `--experimental-vm-modules` loader -- every integration suite
  fails to load. `stack-api.md` rule 39's own case for the package is "fewer
  moving parts", so `SignInRateLimitGuard` is one in-process sliding-window
  guard: no dependency, one `Map`, one 60s window, two keys. `stack-api.md`
  rule 39 and `auth.md` rule 17 name the package and should be revisited.
- **Two keys, checked together:** `addressTracker` -> `addr:<ip>` (limit 10),
  `emailTracker` -> `email:<lowercased>` or `addr:<ip>` fallback (limit 5). Both
  are recorded on every attempt; a refusal on either throws
  `CodedException('TOO_MANY_ATTEMPTS', 429)`.
- **Applied via `@UseGuards(SignInRateLimitGuard)` on `postSignIn` only;**
  sign-up, sign-out and the session read carry no guard.
- `trustProxy` was already on the Fastify adapter (`bootstrap.ts`, task 01) --
  confirmed by the forwarded-header test.
- The web's `generated.spec.ts` (Orval drift) is red from task 02 onward because
  `openapi.json` moved ahead of the committed client; task 06 regenerates it.

## References

- `auth.md` rule 17 and `stack-api.md` rule 39 — one throttler guard, two keys.
- `auth.md` gotcha 34 — `trustProxy`, or the address key is the proxy.
- `architecture-api.md` rules 39–40 — one error vocabulary, no second error type.
- `libs/contracts/src/errors.ts` — `TOO_MANY_ATTEMPTS`, declared in task `02`.
- `requirements.md` `FR.5.1` — rate-limited per source address and per account.
- `requirements.md` `FR.5.3` — counters in process memory; correct only for a
  single process.

## Implement with

`/api-feature`
