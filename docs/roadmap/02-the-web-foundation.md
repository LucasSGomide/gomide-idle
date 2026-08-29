# 02 — The web foundation: shell, design system and the first rendered screen

**Depends on:** 01 · **Status:** done · **Estimate:** 9

## Context

- Covers the web half of the **Project scaffolding** requirements: `UN.16` in
  full, the client side of `UN.10`, and the web's share of `UN.11`, `UN.12`,
  `UN.14` and `UN.15`. [`01`](01-the-api-foundation.md) covers the rest.
- This is where `UN.10`'s end-to-end path visibly completes: a route renders
  values fetched by a generated hook from `01`'s endpoint, which read Postgres
  through Drizzle.
- `UN.16` is why the shell is built now rather than with the login screen. A
  screen built against provisional styling is a screen built twice, so the
  tokens, both catalogues and the error boundary land before the first form.
- `design.md` §1 specifies the signed-out top bar but no body for it, because
  the login screen that owns `/` belongs to the **Account sign-up and login**
  item. Decided 2026-08-28: `/` renders the shell over an empty body, with the
  three values on a persistent footer. Account fills the body and the footer
  stays, so nothing on the path is the throwaway `FR.10.4` forbids.
- `01` created the workspace, the linter, the boundary checker, the regenerate
  command and the CI workflow. This item adds the web's configuration into them
  rather than writing a second set.
- The socket client is built here and speaks to `01`'s unauthenticated
  handshake. It compares the protocol integer and nothing else.

## User Experience:

- **Entry** — `/`, the only route. A fresh load lands here; the Account item
  later fills its body with the login form.
- **Flow** — the shell paints from the language mirrored in `localStorage`, read
  synchronously at startup, so a returning Portuguese player never sees an
  English frame.
- **Flow** — the footer's three values arrive from the generated hook after the
  shell is already on screen.
- **Flow** — switching language re-renders every string at once and writes to
  `localStorage` alone; there is no account to carry the choice to yet.
- **States** — pending: no footer line and no spinner. The shell is the page.
- **States** — error: the footer renders the error's `code` through the
  catalogue, never the server's `message`.
- **States** — protocol mismatch: a full-screen "your client is out of date,
  reload" message, per `stack-web.md` rule 22.
- **States** — a route's subtree throwing renders the boundary's block in place
  of that region alone; the top bar and the footer stay on screen. The
  application-root boundary renders the same block full-width, with the bar
  still drawn. Decided 2026-08-28.
- **New pattern** — a persistent footer carrying the protocol, content-pack and
  build values. Nothing in [`design.md`](../design.md) describes a footer; the
  design doc owes a rule once this ships.

## Key Areas:

- **Front-end** — the six folders and nothing beside them but the entry point
  and the three generated files, no feature importing a feature, `ui/` knowing
  no feature; `architecture-web.md` rules 6–13, 27.
- **Web stack** — React 19 on Vite 8, TanStack Router and Query, Tailwind v4
  over generated tokens, react-i18next with both catalogues typed, Orval 8.0.2+
  with MSW, Vitest; `stack-web.md` rules 1–3, 22, 38–39, 41–53, 57–58, 60–61.
- **Design** — the signed-out top bar is `design.md` §1's Account/login row
  ([`design.md:42`](../design.md)) and the standalone switcher is §13's
  signed-out control ([`design.md:664`](../design.md)); every component is sized
  against the Portuguese string and nothing truncates.

## Technical Details:

1. Scaffold `apps/web` on React 19, Vite 8 and TypeScript, giving `src/` exactly
   `routes/`, `features/`, `renderer/`, `transport/`, `ui/` and `lib/`.
2. Write the token generator: `docs/design-tokens.json` to
   `apps/web/src/theme.css` and `theme.ts`, mapping `color.accent.default` to
   `--color-accent` and `spacing.5` to `--spacing-5`. Commit both outputs and add
   the CI step that regenerates and fails on a difference.
3. Add Tailwind v4 over that theme and copy in only the primitives the shell
   needs, edited in place rather than wrapped.
4. Add TanStack Router with `@tanstack/router-plugin`, commit `routeTree.gen.ts`,
   and write `__root.tsx` and `index.tsx`.
5. Build the top bar in `__root.tsx`: 56px tall, wordmark left, standalone
   language switcher right, sized against the Portuguese string. The wordmark is
   one line — `Tormented Path: Mortal Ways`, the game name bold and the active
   season italic — both from a single `brand` module and neither a translation
   key (`design.md` §1, `naming.md` rule 16).
6. Add react-i18next 17 and i18next 26 with English and Portuguese catalogues in
   `lib/i18n/`, a `react-i18next.d.ts` declaring `CustomTypeOptions['resources']`
   as `typeof en` with `returnNull: false`, and the Portuguese catalogue written
   `satisfies typeof en`.
7. Read the mirrored language from `localStorage` synchronously at startup and
   have the switcher write there and nowhere else.
8. Run Orval 8.0.2 or later against `01`'s committed document into `lib/` —
   fetch client, TanStack Query hooks, and MSW handlers via
   `mock: { generators: [{ type: 'msw' }] }` — and write the fetch mutator once,
   holding the relative base path and `credentials`.
9. Add the error boundary at the application root and on every route, and the
   catalogue entries that render an error from its `code`.
10. Build the footer from the generated hook, with the pending and error states
    above.
11. Add the socket client in `transport/`, the only file importing Socket.IO: it
    compares the handshake's protocol integer against the one hard-coded here and
    renders the out-of-date screen on a mismatch.
12. Extend `01`'s regenerate command to cover the route tree, the theme and
    Orval's output, and add the web's checks to `01`'s CI workflow — Vitest with
    MSW at the network boundary, and dependency-cruiser run from `apps/web` with
    the six-folder and no-cross-feature rules.

### Technical References:

- `stack-web.md` rules 1–3 — React 19, Vite 8, TanStack Query and Router.
- `stack-web.md` rules 38–39 — the generated route tree and its file naming.
- `stack-web.md` rules 41, 44 — Vitest, and jsdom only where something renders.
- `stack-web.md` rules 45–47 — the token pipeline and the ban on raw values.
- `stack-web.md` rules 48–53 — both catalogues, the typed resources, the
  `localStorage` mirror and the signed-out switcher.
- `stack-web.md` rules 57–58, 61 — the generated hooks, MSW, and Orval 8's three
  traps.
- `stack-web.md` rule 22 — refusing to proceed on a protocol mismatch.
- `architecture-web.md` rules 6–13 — the six folders and the import rules.
- `architecture-web.md` rules 11, 27, 32 — the single mutator, rendering an error
  from its code, and no content-pack version check.
- `design.md` §1 ([`design.md:42`](../design.md)) and §13
  ([`design.md:664`](../design.md)) — the signed-out top bar and the switcher.
- `naming.md` rule 15 — the `SCREAMING_SNAKE_CASE` error codes the catalogue keys
  off.
- `naming.md` rule 16 — the game name and the active season, from one `brand`
  module rather than a literal typed twice.
- `requirements.md` `FR.10.1`, `FR.10.3`, `FR.11.3`, `FR.11.6`, `FR.12.2`,
  `FR.13.3`, `FR.14.3`, `FR.15.4`, `UN.16`.

## As built

What the seven slices settled that the twelve steps did not:

- **Shell chrome became its own folder, `routes/-shell/`.** Step 5 put the top
  bar "in `__root.tsx`" and Technical Detail names only `__root.tsx` and
  `index.tsx` under `routes/`. As built the bar, footer, language switcher,
  wordmark, error block, error boundary, root error view and out-of-date screen
  are nine modules under `routes/-shell/` — a `-`-prefixed folder TanStack Router
  keeps out of the route tree. Shell chrome is neither a feature nor generic
  enough for `ui/`, and `__root.tsx` holding all of it would be unreadable. Later
  screens inherit this location.
- **The error boundary is two mechanisms, not one.** Step 9 reads as a single
  thing. `architecture-web.md` rule 23 needs both TanStack Router's
  `errorComponent` (a route component throwing during render) and a hand-written
  `ErrorBoundary` class (throws outside that path — an event-handler re-render, a
  shell child). The top bar and footer sit outside both, which is what keeps them
  on screen in either case.
- **Orval's client resolves an envelope, so consumers unwrap it.** The mutator
  (`lib/api/fetcher.ts`) returns `{ status, data, headers }`, not the bare body.
  The footer reads `server_meta` through `features/server-meta/use-server-meta.ts`,
  which re-exports the generated hook with a `select` that strips the envelope —
  so even shell chrome goes through a `features/` hook (`architecture-web.md`
  rule 14) rather than calling the generated hook directly as step 10 implies.
- **The token generator sits outside `src/` and emits a second export.** It lives
  in `scripts/theme/`, not one of the six folders. `theme.css` is a Tailwind v4
  `@theme` block — it *is* the Tailwind config, so step 3 needs no separate
  config file. `theme.ts` also emits `themeColorHex`, a `0x`-integer colour
  subset for PixiJS text styles (`stack-web.md` rule 54), which none of the
  twelve steps mention.
- **Non-generated CSS lives in `lib/styles/app.css`, apart from `theme.css`.**
  `app.css` imports Tailwind, imports the generated `theme.css`, and adds the
  `@font-face` and `color-scheme` base layer — the parts a theme regenerate must
  not clobber. Step 3 folded the fonts into this slice without saying where the
  hand-written CSS goes.
- **The socket guard is split in two.** `transport/socket.ts` opens the
  connection; `transport/protocol-guard.tsx` is the `useProtocolGuard` hook
  `__root.tsx` calls. Step 11 described one file; the transport/React seam forced
  the split, keeping `.tsx` and React out of `socket.ts`.

## Blockers:

- The footer is a **New pattern** and [`design.md`](../design.md) describes no
  footer at all — §1 ends at the top bar and the live-hunt column
  ([`design.md:27`](../design.md)). Its height, placement and type scale are
  decided in this item.
- `stack-web.md` rule 45 says the JSON-path-to-custom-property mapping "lives in
  the generator", and no generator exists. This item is where that convention is
  fixed, and every later token read depends on it.
- `stack-web.md` rule 58 leaves `/api/auth/*` handlers hand-written and outside
  the spec. Nothing in this item touches those routes, so the one part of the
  network fake that can drift ships unexercised.
- `FR.11.6` wants one command that makes a fresh clone type-check, but `01` wrote
  that command before `apps/web` existed. Step 12 extends it, and until it runs
  the route tree, the theme and Orval's client are three files that do not exist.
