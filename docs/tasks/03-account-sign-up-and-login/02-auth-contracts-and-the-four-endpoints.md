# 02 — The auth contracts, the four endpoints and their error codes

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** back-end · **Depends on:** 01

## Context

- Auth is exposed through this project's own Nest controllers, each calling
  Better Auth's server-side `auth.api` as a function. Decided 2026-08-29 against
  the previous rule, so auth is described by `libs/contracts` like every other
  endpoint — in the OpenAPI document, with a generated client, generated network
  fakes and declared error codes.
- Nothing in this repository has run that reversal yet. The controller depends on
  `auth.api.signInEmail(…, { asResponse: true })` handing back the `set-cookie`
  the library would have written; if it does not, the header is lifted with
  `returnHeaders` instead. **This slice decides which and records it.**
- `01`'s `As built` recorded that a top-level `.meta({ id })` collides with
  `cleanupOpenApiDoc`'s own hoist, so `serverMetaResponseSchema` carries none.
  The four auth DTOs meet the same constraint while `stack-api.md` rule 47 still
  asks every reusable schema to be explicitly named.
- `libs/contracts/src/errors.ts` holds two codes today and its own comment sets
  the rule: a code is added to the vocabulary *before* it is thrown.
  `TOO_MANY_ATTEMPTS` and `REGISTRATION_CLOSED` are declared here and thrown in
  tasks `04` and `03`.

## Technical details

- **Back-end** — four use cases in `auth/application/` and one
  `@Controller('auth')` in `auth/entrypoint/`: `POST sign-up`, `POST sign-in`,
  `POST sign-out`, `GET session`. The controller decides nothing;
  `architecture-api.md` rules 19–24, 37, 40.
- **Auth** — each use case calls `auth.api.*` and the controller copies the
  library's `set-cookie` onto the Fastify reply; `auth.md` rules 3, 19 and
  gotcha 35 (the body parser stays on).
- **API stack** — write the sign-up, sign-in, sign-out and session schemas,
  request and response, in `libs/contracts`, naming each OpenAPI component the
  way `01`'s `As built` settled for `serverMetaResponseSchema` rather than
  assuming a top-level `.meta({ id })` survives `cleanupOpenApiDoc`;
  `stack-api.md` rule 47.
- **Naming** — add `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `TOO_MANY_ATTEMPTS` and
  `REGISTRATION_CLOSED` to `ERROR_CODES`. Each names the situation and never the
  status; `assertSituationCode` rejects the second (`naming.md` rule 15).
- **Back-end** — translate the library's error into the code inside the
  controller. There is one error vocabulary and no second error type;
  `architecture-api.md` rules 39–40.
- **Back-end** — sign-out deletes that device's session row and leaves another
  device's alone (`FR.2.1`, `FR.2.4`).

## Acceptance criteria

- [x] `(integration)` `POST auth/sign-up` with a fresh e-mail and a valid password creates the account, signs the player in and sets the session cookie on the response
- [x] `(integration)` `POST auth/sign-up` with an e-mail that already has an account returns `EMAIL_TAKEN` and leaves one row
- [x] `(integration)` `POST auth/sign-in` with correct credentials sets the session cookie; a wrong password returns `INVALID_CREDENTIALS` and sets none
- [x] `(integration)` `POST auth/sign-out` deletes that session's row and clears the cookie, while a second session for the same user still resolves
- [x] `(integration)` `GET auth/session` returns the signed-in user's id and e-mail read from the cookie
- [x] `(unit)` every code added to `ERROR_CODES` passes `assertSituationCode`
- [x] `(integration)` a password outside 8–128 characters is refused with `VALIDATION_FAILED` and creates no row
- [x] `(integration)` the emitted OpenAPI document carries one named component per auth request and response schema, with no inline duplicate left by `cleanupOpenApiDoc`

## As built

- **`asResponse: true`, not `returnHeaders`.** Every use case calls
  `auth.api.*({ ..., asResponse: true })`; Better Auth 1.7.2 hands back a web
  `Response` for success _and_ failure (a 4xx body `{ code, message }`, no
  throw). The use case normalises it to `AuthApiResultType`
  (`{ ok, status, body, setCookie }`); the controller copies `setCookie` onto
  the Fastify reply, sets its own success status, and on `!ok` maps `body.code`
  to one `ERROR_CODES` entry.
- **The library's error codes map as:**
  `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` -> `EMAIL_TAKEN` (409),
  `INVALID_EMAIL_OR_PASSWORD` -> `INVALID_CREDENTIALS` (401), anything else -> a
  bare 500. Done once, in `entrypoint/auth-error.ts`.
- **Body shape is checked at the entrypoint** with `schema.safeParse` and a
  `CodedException('VALIDATION_FAILED', ...)` on failure -- the same pattern
  `system.gateway.ts` uses for socket messages -- rather than a global
  `ZodValidationPipe`, which stays out of scope until more than auth has a body
  (architecture-api.md rule 26).
- **`GetSessionUseCase` is exported** from `AuthModule` so task 03's guard and
  task 05's handshake read the session through the same use case (auth.md
  rule 32, architecture-api.md rule 25).
- **`AuthInstanceType` and `AUTH_INSTANCE` both live in `auth.tokens.ts`** at the
  module root, so `application/` can type the injected instance without importing
  `infrastructure/`.
- sign-up responds 201, sign-in / sign-out / session 200; the DTO classes carry
  no top-level `.meta({ id })` and `cleanupOpenApiDoc` hoists `AuthUser` on its
  own.

## References

- `auth.md` rules 3, 19 — reversed 2026-08-29: our own controllers, in the
  document.
- `auth.md` gotchas 29, 35 — the cookie and `credentials`; why the body parser
  stays on.
- `stack-api.md` rule 47 — every reusable schema is an explicitly named
  component.
- `architecture-api.md` rules 19–24, 37, 40 — the four inward-only layers and
  controllers that decide nothing.
- `architecture-api.md` rule 39 — the one `code` vocabulary in `libs/contracts`.
- `naming.md` rule 15 — a code spells the situation, never the HTTP status.
- `libs/contracts/src/errors.ts` — `ERROR_CODES` and `assertSituationCode` as
  they stand.
- `requirements.md` `FR.1.1`, `FR.1.3`, `FR.1.4`, `FR.2.1`, `FR.2.4` — sign-up
  signs the player in, the password bounds, the duplicate refusal, the session as
  a row, and sign-out as a per-device delete.
- Roadmap `01`'s `As built` — the `.meta({ id })` collision with
  `cleanupOpenApiDoc`.

## Implement with

`/api-feature`
