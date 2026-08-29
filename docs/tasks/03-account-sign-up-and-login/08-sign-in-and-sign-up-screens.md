# 08 — The sign-in and sign-up screens

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** front-end · **Depends on:** 04, 07

## Context

- `02` reserved `/`'s body for this item and kept the footer persistent. This is
  the slice that fills it, and the shell around it does not change.
- It depends on `04` as well as `07` because `TOO_MANY_ATTEMPTS` is one of the
  four codes these forms render, and it is only thrown once the throttler exists.
- Every failure renders from its own `code` through the catalogue. The server's
  `message` is never shown — `lib/api/fetcher.ts` already keeps the code and
  discards nothing else.
- With registration closed, `/sign-up` still resolves and renders the closed
  notice in place of the form, and sign-in hides the link. The flag comes from
  `GET auth/session`, which task `03` made answer while signed out.
- The 401 handler belongs in the fetch mutator, once, not in either screen.

## User experience

- **Entry** — `/`, the sign-in screen, filling the empty body `02` left. A player
  who already has a session is redirected to `/characters`.
- **Entry** — `/sign-up`, its own route, linked from sign-in. Same redirect when a
  session already exists.
- **Flow** — sign-up takes an e-mail and a password, creates the account, signs
  the player in and lands on `/characters`. Sign-in takes the same two fields and
  lands on the search param's target, or `/characters`.
- **States** — pending: the submit button swaps its label for a spinner at the
  same size and never resizes. Field errors put `danger` on the border and helper
  text with a trailing icon.
- **States** — duplicate e-mail, wrong credentials, too many attempts and
  registration closed each carry their own error `code` and render through the
  catalogue, never from the server's message. With registration closed,
  `/sign-up` still resolves and renders the closed notice in place of the form,
  and sign-in hides the link.
- **Pattern** — `design.md` §5's Inputs and Buttons and §8's error states,
  unchanged; every control sized against the Portuguese string.

## Technical details

- **Front-end** — build `/` and `/sign-up` from the generated mutation hooks; no
  hand-written request; `stack-web.md` rules 57–59.
- **Front-end** — add the single 401 handler to the fetch mutator in
  `lib/api/fetcher.ts`, not to either screen; `auth.md` rules 23–28.
- **Front-end** — both routes redirect to `/characters` when a session already
  exists, reading it through `features/session/` from task `07`.
- **Front-end** — sign-in lands on the search param's target when present and
  `/characters` otherwise; the param is validated as an internal path rather than
  trusted, so it cannot become an open redirect.
- **Front-end** — `/sign-up` reads the registration flag from `GET auth/session`
  and renders the closed notice in place of the form; sign-in hides its link on
  the same flag.
- **Front-end** — add both catalogues' entries for every new error code, form
  label and helper string; rendering is from the code, never the server's
  message; `architecture-web.md` rule 27.
- **Design** — §5's Inputs and Buttons and §8's error and loading states; the
  submit button never resizes when it swaps its label for a spinner, and every
  control is sized against the Portuguese string.

## Acceptance criteria

- [ ] `(unit)` submitting sign-up with a valid e-mail and password calls the generated mutation and lands on `/characters`
- [ ] `(unit)` submitting sign-in lands on the search param's target when present and `/characters` otherwise, and refuses a target that is not an internal path
- [ ] `(unit)` `/` and `/sign-up` both redirect to `/characters` when a session already exists
- [ ] `(unit)` while a submit is in flight the button renders a spinner in place of its label and its width does not change
- [ ] `(unit)` a field error puts `danger` on the border and renders helper text with its trailing icon
- [ ] `(unit)` `EMAIL_TAKEN`, `INVALID_CREDENTIALS` and `TOO_MANY_ATTEMPTS` each render their catalogue string and never the server's `message`
- [ ] `(unit)` with registration closed, `/sign-up` resolves and renders the closed notice in place of the form, and `/` no longer shows the link
- [ ] `(unit)` a 401 from any request is handled once in the fetch mutator and returns the player to `/`
- [ ] `(unit)` every new string exists in both `en.ts` and `pt.ts`, so the catalogue type spec stays satisfied
- [ ] `(unit)` both forms render their Portuguese strings without truncation at the narrowest supported width

## References

- `stack-web.md` rules 57–59 — the generated hooks and client; no Better Auth on
  the web.
- `auth.md` rules 23–28 — the web side, rewritten 2026-08-29, and the one 401
  handler.
- `auth.md` rules 16, 18 — closed registration, reported rather than guessed.
- `architecture-web.md` rules 6–13 — the folders and the import rules.
- `architecture-web.md` rule 27 — render from the code, not the server's message.
- `design.md` §5 and §8 — Inputs, Buttons, and the error and loading states.
- `libs/contracts/src/errors.ts` — the four codes declared in task `02`.
- `apps/web/src/lib/i18n/en.ts`, `pt.ts` and `catalogue.test-d.ts` — both
  catalogues and the type-level parity check.
- `requirements.md` `FR.1.1`, `FR.1.4`, `FR.5.1`, `FR.5.2` — sign-up signs the
  player in, the duplicate refusal, the rate limit and closed registration.

## Implement with

`/web-feature`
