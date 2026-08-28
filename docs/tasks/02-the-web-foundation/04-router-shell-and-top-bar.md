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
- **Front-end** — write `__root.tsx` and `index.tsx` under `routes/`;
  `architecture-web.md` rules 6–13.
- **Design** — build the top bar in `__root.tsx`: 56px tall, wordmark left,
  standalone language switcher right, sized against the Portuguese string.
- **Design** — nothing truncates; every component is sized against the Portuguese
  string.

## Acceptance criteria

- [ ] `(integration)` the route tree regenerates from `routes/` and matches the committed `routeTree.gen.ts`
- [ ] `(e2e)` loading `/` renders the top bar over an empty body
- [ ] `(unit)` the top bar is 56px tall, with the wordmark left and the switcher right
- [ ] `(e2e)` a load with Portuguese mirrored in `localStorage` paints the bar in Portuguese, with no English frame first
- [ ] `(e2e)` switching to Portuguese re-renders every string in the bar at once and writes only to `localStorage`
- [ ] `(unit)` the top bar renders its Portuguese strings without truncation at the narrowest supported width

## References

- `stack-web.md` rules 38–39 — the generated route tree and its file naming.
- `stack-web.md` rules 1–3 — React 19, Vite 8, TanStack Query and Router.
- `stack-web.md` rules 48–53 — the signed-out switcher and the `localStorage`
  mirror it writes to.
- `architecture-web.md` rules 6–13 — the six folders and the import rules.
- `design.md` §1 ([`design.md:42`](../../design.md)) and §13
  ([`design.md:664`](../../design.md)) — the signed-out top bar and the switcher.
- `requirements.md` `FR.16.2` — the app shell renders the top bar specified for a
  signed-out screen: the wordmark and a standalone language switcher.
- `requirements.md` `FR.10.4` — nothing on the path is a throwaway fixture.

## Implement with

`/web-feature`
