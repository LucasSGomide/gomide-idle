# 07 — `features/session`, the `_authed` guard and the characters shell

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** front-end · **Depends on:** 06

## Context

- The web can now reach the API and has generated auth hooks. This slice is where
  the browser learns whether anybody is signed in.
- It comes before the two screens because sign-in has to land somewhere and
  sign-up has to redirect somewhere. `/characters` is that somewhere, and it is
  built here as the signed-in top bar over an empty body.
- The empty body is a decision, not a placeholder: the character list belongs to
  the **Character creation and selection** item, along with the rest of `UN.3`
  and all of `UN.4`.
- `player_account` is not created in this item, so the in-menu language switcher
  writes `localStorage` alone, exactly as `02`'s signed-out one has. It gains a
  second write path in **Language and localisation**; nothing here is rewritten.
- Signing out closes that session's socket server-side — task `05` already does
  it — and this slice only calls the mutation and leaves.

## User experience

- **Entry** — any route under `_authed` reached without a session redirects to
  `/`, carrying the target in a search param for sign-in to return the player to.
- **Entry** — `/characters` is where a signed-in player lands: the signed-in top
  bar over an empty body.
- **Flow** — the signed-in top bar's account menu holds the language switcher and
  the sign-out control; signing out returns to `/` and closes that session's
  socket, leaving another device's alone.
- **States** — while the session is resolving, the guarded route shows `02`'s
  loading state and never flashes the signed-out shell first.
- **States** — a session request that fails renders from its `code` through the
  catalogue, never from the server's message.
- **Pattern** — the signed-in top bar is `design.md` §1's Character-select row
  ([`design.md:54`](../../design.md)); the in-menu switcher is §13's signed-in
  control ([`design.md:675`](../../design.md)). Every control sized against the
  Portuguese string.

## Technical details

- **Front-end** — `features/session/` is the only session reader, built over the
  generated hooks; no feature imports another feature;
  `architecture-web.md` rules 6–13, 33.
- **Front-end** — `_authed.tsx` is the only guard: it resolves the session in
  `beforeLoad` and redirects to `/` with the target search param;
  `architecture-web.md` rule 22, `stack-web.md` rule 39 for the name.
- **Front-end** — `_authed/characters.tsx` renders the signed-in top bar over an
  empty body; the character list is the next roadmap item's.
- **Front-end** — the account menu's language switcher writes `localStorage`
  exactly as `02`'s signed-out switcher does; `stack-web.md` rules 52–53 are
  unchanged and `player_account` is not created here.
- **Front-end** — sign-out calls the generated mutation and returns to `/`;
  errors render from the code, never the server's message
  (`architecture-web.md` rule 27).
- **Design** — the top bar is §1's Character-select row and the in-menu switcher
  §13's signed-in control, both sized against the Portuguese catalogue.

## Acceptance criteria

- [x] `(unit)` `_authed` reached with no session redirects to `/` with the attempted path in the search param
- [x] `(unit)` `_authed` reached with a session renders the route, and `/characters` shows the signed-in top bar over an empty body
- [x] `(unit)` while the session request is in flight the guarded route renders the loading state and never the signed-out shell
- [x] `(unit)` a failed session request renders its catalogue string from the `code` and never the server's `message`
- [x] `(unit)` the account menu holds the language switcher and the sign-out control, and switching language writes `localStorage` and re-renders every string at once
- [x] `(unit)` sign-out calls the generated mutation and lands on `/`
- [x] `(unit)` the signed-in top bar renders its Portuguese strings without truncation at the narrowest supported width

## As built

- **The top bar is session-aware, in `routes/-shell/`.** `routes/` may read the
  session (architecture-web.md rule 33), and the wireframe puts the account menu
  in the same bar the standalone switcher occupies. While `useSession()` is
  pending the right slot is empty (no flash); signed in it is `AccountMenu`,
  signed out `LanguageSwitcher`. The open/close behaviour and the language rows
  are shared (`use-menu-toggle`, `LanguageMenuItems`).
- **`_authed.tsx` resolves the session in `beforeLoad`** via
  `features/session/require-session.ts` through the query cache `useSession`
  reads, then redirects to `/` with `search.redirect`. `pendingMs: 0` +
  `pendingMinMs: 0` show `AuthPending` (spinner, `aria-live="polite"`) only
  during the real async gap; `errorComponent` renders `AuthError` from the
  `code`.
- **`orval.config.ts` dropped the `query: { useQuery: true }` override.** It was
  forcing every operation to a `useQuery` hook, so the POST auth endpoints had
  no mutation hook. Orval's default (GET -> query, POST -> mutation) is what the
  footer read and the sign-out write each need; the client was regenerated.
- **Catalogue additions:** `topBar.account`, `topBar.signOut`, `session.loading`
  in both `en.ts` and `pt.ts`; `catalogue.test-d.ts` updated.
- `renderRoute` now returns the `router` so a spec can assert the post-redirect
  location and search.
- The signed-in top bar reuses the account menu on every `_authed` screen; the
  online indicator slot (§1) stays free — the socket opens at character select
  (next roadmap item).

## References

- `architecture-web.md` rules 6–13 — the six folders and the import rules.
- `architecture-web.md` rule 22 — one guard.
- `architecture-web.md` rule 27 — render from the code, not the server's message.
- `architecture-web.md` rule 33 — who may read the session.
- `stack-web.md` rule 39 — `_authed.tsx`'s name.
- `stack-web.md` rules 52–53 — the `localStorage` language mirror, unchanged.
- `stack-web.md` rules 57–59 — the generated hooks this feature is built on.
- `auth.md` rules 23–28 — the web side, rewritten 2026-08-29.
- `auth.md` gotcha 30 — jsdom carries no cookie, so the session is faked at the
  handler, not the browser.
- `design.md` §1 ([`design.md:54`](../../design.md)) and §13
  ([`design.md:675`](../../design.md)) — the Character-select top bar and the
  in-menu switcher.
- `requirements.md` `FR.2.4` — signing out destroys that device's session and
  leaves others alone.

## Implement with

`/web-feature`
