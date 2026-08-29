# 04 — The router, the root shell and the top bar

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** 02, 03

## Context

- This is the first screen. `/` is the only route, and it renders the shell over
  an empty body.
- The empty body is a decision, not a placeholder: `design.md` §1 specifies the
  signed-out top bar but no body for it, because the login screen that owns `/`
  belongs to the **Account sign-up and login** item. Account fills the body later
  and the shell stays, so nothing here is the throwaway `FR.10.4` forbids.
- The top bar is built now rather than with the login screen because a screen
  built against provisional styling is a screen built twice.
- The language switcher is the bar's only control, and it drives the mirror task
  `03` already shipped.
- The wordmark is one line — `Tormented Path: Mortal Ways`, the game name bold
  and the active season italic (`design.md` §1, `naming.md` rule 16). Both
  strings live in one `brand` module under `lib/` — `GAME_NAME` and
  `ACTIVE_SEASON` — and are proper nouns: never translation keys, identical in
  both languages. The season is a bare label here; nothing switches on it.

## User experience

- **Entry** — `/`, the only route. A fresh load lands here; the Account item later
  fills its body with the login form.
- **Flow** — the shell paints from the language mirrored in `localStorage`, read
  synchronously at startup, so a returning Portuguese player never sees an English
  frame.
- **Flow** — switching language re-renders every string at once and writes to
  `localStorage` alone; there is no account to carry the choice to yet.
- **States** — the body is empty. The shell is the page.
- **Pattern** — the signed-out top bar is `design.md` §1's Account/login row
  ([`design.md:42`](../../design.md)); the standalone switcher is §13's signed-out
  control ([`design.md:664`](../../design.md)).

## Technical details

- **Web stack** — add TanStack Router with `@tanstack/router-plugin`, commit
  `routeTree.gen.ts`, and extend `01`'s regenerate command to cover it;
  `stack-web.md` rules 38–39.
- **Front-end** — write `__root.tsx` and `index.tsx` under `routes/`, and the
  `brand` module under `lib/` exporting `GAME_NAME` (`Tormented Path`) and
  `ACTIVE_SEASON` (`Mortal Ways`); nothing else spells either string;
  `architecture-web.md` rules 6–13.
- **Design** — build the top bar in `__root.tsx`: 56px tall, wordmark left,
  standalone language switcher right, sized against the Portuguese string. The
  wordmark is a single non-wrapping line in Rajdhani — `GAME_NAME` bold, then
  `: `, then `ACTIVE_SEASON` italic — both read from the `brand` module;
  `design.md` §1, `naming.md` rule 16.
- **Design** — nothing truncates; every component is sized against the Portuguese
  string.

## Acceptance criteria

- [x] `(integration)` the route tree regenerates from `routes/` and matches the committed `routeTree.gen.ts`
- [x] `(e2e)` loading `/` renders the top bar over an empty body
- [x] `(unit)` the top bar is 56px tall, with the wordmark left and the switcher right
- [x] `(unit)` the wordmark renders on one line as `GAME_NAME` bold, `": "`, then `ACTIVE_SEASON` italic, both from the `brand` module and neither spelled as a literal anywhere else in the app
- [x] `(unit)` the wordmark and season render identically under a Portuguese `localStorage` mirror as under English — neither is a translation key
- [x] `(e2e)` a load with Portuguese mirrored in `localStorage` paints the bar in Portuguese, with no English frame first
- [x] `(e2e)` switching to Portuguese re-renders every string in the bar at once and writes only to `localStorage`
- [x] `(unit)` the top bar renders its Portuguese strings without truncation at the narrowest supported width

## References

- `stack-web.md` rules 38–39 — the generated route tree and its file naming.
- `stack-web.md` rules 1–3 — React 19, Vite 8, TanStack Query and Router.
- `stack-web.md` rules 48–53 — the signed-out switcher and the `localStorage`
  mirror it writes to.
- `architecture-web.md` rules 6–13 — the six folders and the import rules.
- `design.md` §1 ([`design.md:42`](../../design.md)) and §13
  ([`design.md:664`](../../design.md)) — the signed-out top bar and the switcher.
- `design.md` §1 — the wordmark: one line, `Tormented Path: Mortal Ways`, name
  bold and season italic.
- `naming.md` rule 16 — the game is _Tormented Path_, the season is _Mortal Ways_,
  and both come from one `brand` module rather than a literal typed twice.
- `requirements.md` `FR.16.2` — the app shell renders the top bar specified for a
  signed-out screen: the wordmark and a standalone language switcher.
- `requirements.md` `FR.10.4` — nothing on the path is a throwaway fixture.

## Implement with

`/web-feature`
