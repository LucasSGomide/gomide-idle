# 03 — The global session guard and the registration switch

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** back-end · **Depends on:** 02

## Context

- Task `02` made the four endpoints answer. Nothing yet *requires* a session, so
  this is the slice that makes the API guarded by default and public by
  exception.
- `FR.5.2`: registration closes by configuration, refusing new sign-ups while
  existing accounts keep working. The flag is read by the API and reported to the
  web, so the sign-up link is hidden rather than guessed at.
- `GET auth/session` is public alongside sign-up and sign-in. The roadmap's step
  6 lists only the latter two, but its step 7 needs the session route to answer
  while signed out so `/sign-up`'s link can be hidden — the list predates the
  flag.
- `FR.2.2`'s sliding expiry has no test tier that can advance thirty days.
  `apps/api/test/integration` runs against real Postgres, so renewal is checked by
  writing an expiry directly and asserting the guard either side of it.
- `apps/api/test/env.spec.ts` fails when `env.ts` and `.env.example` drift, so
  the new variable is added to both together.

## Technical details

- **Auth** — a session guard over `auth.api.getSession`, registered globally in
  the app module; `auth.md` rules 11–13.
- **Auth** — one `@Public()` decorator marks `POST auth/sign-up`,
  `POST auth/sign-in`, `GET auth/session` and `01`'s `server-meta` public.
  Everything else needs a session.
- **Auth** — the guard puts the user id on the request and use cases take it as
  an input; reads are ownership-scoped and a row that exists but is not yours is
  one `NOT_FOUND`; `auth.md` rules 20–22.
- **Back-end** — one 401 handler for the whole API, carrying a `code` like every
  other error; `architecture-api.md` rule 39.
- **API stack** — add the registration switch to `apps/api/src/config/env.ts` and
  to `.env.example` in the same change; `FR.5.2`, `auth.md` rule 18.
- **Auth** — refuse sign-up with `REGISTRATION_CLOSED` when the switch is off,
  and return the flag on `GET auth/session` so the web hides the link rather than
  guessing; `auth.md` rules 16, 18.

## Acceptance criteria

- [ ] `(integration)` a guarded route with no cookie returns 401 carrying a `code`, and with a valid session cookie returns 200
- [ ] `(integration)` `POST auth/sign-up`, `POST auth/sign-in`, `GET auth/session` and `GET server-meta` all answer with no session
- [ ] `(integration)` a session row written with an expiry in the past is refused by the guard, and one inside its window is accepted
- [ ] `(integration)` activity inside the refresh window extends the stored expiry rather than leaving it fixed
- [ ] `(unit)` the environment schema refuses a malformed registration switch and `.env.example` declares it, so `test/env.spec.ts` stays green
- [ ] `(integration)` with registration off, `POST auth/sign-up` returns `REGISTRATION_CLOSED` and creates no row, while `POST auth/sign-in` on an existing account still succeeds
- [ ] `(integration)` `GET auth/session` carries the registration flag both signed in and signed out

## References

- `auth.md` rules 11–13 — the global guard and the public exception.
- `auth.md` rules 20–22 — the user id as use-case input, ownership-scoped reads,
  one `NOT_FOUND`.
- `auth.md` rules 16, 18 — no mail, and closed registration.
- `auth.md` rule 31 — the 30-day sliding session.
- `architecture-api.md` rules 39–40 — one error vocabulary, no second error type.
- `stack-api.md` rules 26–28 — sessions in this project's Postgres.
- `requirements.md` `FR.2.2`, `FR.2.3`, `FR.5.2` — the sliding expiry, expiry
  never ending a hunt, and closing registration by configuration.
- `apps/api/src/config/env.ts` and `apps/api/test/env.spec.ts` — the schema and
  the drift check the new variable joins.

## Implement with

`/api-feature`
