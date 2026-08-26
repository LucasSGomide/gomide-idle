# Front-end rules

Rules for anything front-end-shaped. `project.yml` points every
`**Front-end**` bullet in a roadmap item at this file.

These are architecture principles and front-end standards — constraints on code
structure and dependency direction, on how the renderer, React and the socket
are allowed to talk to each other, and on where a file goes, how a component
gets its data and what the player sees when something fails. Functional
requirements, user needs and tuning notes that used to live here have moved to
[`alpha.md`](../alpha.md)'s Functional Requirements, User Needs and Notes
tables.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

Rules 1–5 were written 2026-08-24 as unnumbered prose; numbering them and
bolding their imperative, on 2026-08-26, were the only edits to them. Rules
6–27 were added on 2026-08-26, when the web side got the pass
[`architecture-api.md`](architecture-api.md) had two days earlier — same
vocabulary, same numbering discipline. There is no web application code yet, so
every rule below is written against [`alpha.md`](../alpha.md),
[`design.md`](design.md) and the existing rule docs rather than against
something already built.

## Dependency direction

1. **The renderer reads state and consumes events; it never computes a rule.**
   The moment the renderer knows a game rule, that rule exists in two places and
   the two will drift.

2. **The client's state is a cache, never the truth.** It is a view of what the
   server last said, so anything derived from it is a display value, not a
   decision.

## Renderer boundary

3. **The renderer owns one element and React never renders inside it.** Two
   systems writing the same DOM subtree is the failure this boundary exists to
   prevent.

4. **The arena event stream never enters React state.** React must not re-render
   at frame rate, so events travel from the transport to the renderer directly.

5. **The gambit and targeting editors live in React, outside the renderer's
   element.** The player edits while the fight runs, so the two write to the
   same screen at the same time and must never share a DOM subtree.

## Folders

Added 2026-08-26. `apps/web/src` is feature-first: everything one screen-area
needs — its components, its hooks, its query keys — sits in one folder, and the
folders that are not features are the boundaries to the outside world plus two
piles of shared code.

```
apps/web/src/
  routes/                 # TanStack Router file routes
  features/
    character/            # components, hooks, query keys for one screen-area
    hunt/
    inventory/
    gambit/
  renderer/               # Pixi and the RendererPort — no React, no game rule
  transport/              # socket client, event decoding
  ports/                  # PortsProvider, usePorts
  ui/                     # copied-in primitives (button, tooltip, …)
  lib/                    # generated api client, i18n catalogues, config, utils
```

6. **Give `apps/web/src` those seven folders, and put nothing beside them but
   the entry point and the two generated files — `stack-web.md` rule 38's route
   tree and rule 45's theme.** Every folder above answers "what
   belongs here" in one line, which is what a `components/` and a `utils/` stop
   doing about a week in — they become the two folders everything lands in when
   nowhere else is obviously right.

7. **Never import one feature from another.** Two features that import each
   other are one feature with a boundary drawn through the middle of it, and
   changing either one then means reading both.

8. **When two features need the same thing, promote it — a presentational piece
   to `ui/`, a pure helper to `lib/` — rather than importing across.** This is
   the moment the structure either holds or rots, so it gets a stated move
   instead of a judgement call. If the thing cannot be promoted because it
   carries a game rule, that is the signal the split is in the wrong place and
   the two are one feature.

9. **Let `ui/` know nothing about any feature: no import from `features/`, and
   no game word in a prop name.** A `<Button>` that takes a `hunt` prop has
   stopped being a primitive, and the next screen copies it rather than reusing
   it.

10. **Keep React and every game rule out of `renderer/` — rules 1 and 4 are what
    that folder is for.** A boundary with a folder is one you can watch being
    broken in a diff; a boundary that is only a principle is one you find broken
    later.

11. **Import the generated API client only in `lib/`, and let `ports/` hand it
    out from there.** Orval rewrites that file whenever the spec changes
    (`architecture-api.md` rule 59), so one import site is the one place a
    regeneration can break.

12. **Import the socket library only in `transport/`.** Decoding a frame and
    knowing which library delivered it are two jobs, and only one of them should
    have to change if rule 34 of `stack-api.md` is ever revisited.

13. **Keep a screen out of its route file: a route file wires a URL to a
    component and does not contain one.** A screen defined inside its route
    cannot be rendered by a test without booting the router.

## Ports

A **port** is an interface for something outside the app that the app does not
control — the generated API client, the socket, the clock, the renderer. It is
the same word `architecture-api.md` rules 31 and 48 use, pointed at the browser
instead of at the database.

14. **Hold the app's ports in one `PortsProvider` at the root and read them with
    `usePorts()`.** One place builds them, so a test builds different ones
    without touching a single import. The price is paid by every test that
    renders anything: nothing works outside that provider, so the wrapper helper
    is written on day one rather than at the fiftieth test.

    ```tsx
    // app root
    <PortsProvider value={{ api, socket, clock }}>

    // features/character/use-character.ts
    export function useCharacter(id: string) {
      const { api } = usePorts();                  // injected
      return useQuery({
        queryKey: characterKeys.detail(id),
        queryFn: () => api.getCharacter(id),
      });
    }

    // features/character/CharacterSheet.tsx
    const { data } = useCharacter(id);             // no client import

    // test
    render(<PortsProvider value={{ api: fakeApi }}>…)
    ```

15. **Never let a component import the API client or the socket, or call `fetch`
    or `Date.now()`.** [`alpha.md`](../alpha.md) decision 2 puts the clock on the
    server — "never `Date.now()` from the browser" — and a component that
    reaches the network itself can only be tested by faking the network around
    it.

16. **Build a port only in `ports/` or `lib/`; a feature receives one, never
    constructs one.** A feature that builds its own client is a second
    configuration point, and the second one is always the one still aimed at the
    old base URL.

17. **Give a component exactly one way to get data: a feature hook.** A
    component that also reads a port directly has two data paths, and a test
    that swaps the port only redirects one of them.

18. **Swap a port in a test by wrapping `PortsProvider` with a fake, never by
    mocking a module.** A module mock is bound to a file path, so it survives
    the refactor that moves the file and quietly stops mocking anything —
    `architecture-api.md` rule 74 draws the same line on the back end — mock only
    what was injected.

19. **Keep the `RendererPort` out of `PortsProvider`; the arena screen builds it,
    and the exception is deliberate.** `stack-web.md` rule 7's port is exactly
    rule 14's idea with a different lifetime: `api`, `socket` and `clock` live as
    long as the app, while a renderer binds to a mounted element and is destroyed
    with it (`stack-web.md` rule 16), so an app-root provider would have to hold
    something that does not exist on any screen but one. A test still swaps it by
    passing a fake in — just not through that provider.

## Data and query keys

20. **Give every feature one `queries.ts` exporting a key factory, and begin
    every key in it with the feature's folder name.** Two features cannot collide
    because a folder name is unique by definition, and it makes an invalidation
    say what it means: `['hunt']` clears one feature's caches and nothing else.

    ```ts
    // features/hunt/queries.ts
    export const huntKeys = {
      all: ['hunt'] as const,
      detail: (id: string) => ['hunt', 'detail', id] as const,
    };
    ```

21. **Let a route loader prefetch and guard; the component still takes its data
    from a feature hook.** A loader that returns data is a second cache with its
    own invalidation, and `stack-web.md` rule 2 keeps exactly one — so a loader
    warms the same query the hook will read rather than fetching beside it.
    `stack-web.md` rule 40 is how that is written.

22. **Put the auth guard in one layout route and nowhere else.** A guard repeated
    per route is a guard that is missing from the route added next week. What it
    checks is deferred — see the note at the end of this file.

## Failure and loading

`stack-web.md` rule 22 already refuses to start the renderer on a protocol
mismatch. That was the only failure state with a rule; these are the rest.

23. **Put an error boundary at the app root, one on every route, and one around
    the renderer's element.** Three, because they fail differently: the root one
    stops a white page from being the entire answer, the route one keeps a broken
    screen from taking the top bar and the navigation down with it, and the
    renderer's keeps a Pixi failure from unmounting the HUD that would have
    explained it.

24. **Distinguish loading from empty by the query's status, never by the length
    of its data.** `data?.length === 0` is also true while the fetch is in
    flight, so an inventory that is merely slow renders `design.md` §8's "No
    items yet" — a sentence that must be true whenever it is on screen.

25. **Keep the socket's state on screen for as long as it is down.**
    `design.md` §8 specifies the persistent "Reconnecting…" banner and the
    per-action disabling; the reason it is not optional is that a dropped socket
    becomes a leave after five seconds ([`alpha.md`](../alpha.md)), and a player
    who cannot see that it dropped cannot do the one thing that would save the
    run.

26. **Freeze the arena on a starved buffer and say so; never blank it.**
    `stack-web.md` rule 21 stops the extrapolation at two ticks — this is what
    the player sees afterwards, which is the last frame held with a stated reason
    over it. An arena that empties itself reads as "everything died".

27. **Render an error from its `type`, never from the server's `message`.**
    `architecture-api.md` rules 39 and 45 put an `ErrorTypeEnum` member on every
    error so that one client switch covers both transports, and that message is
    one language written for a developer — with `stack-web.md` rule 48 shipping
    Portuguese, rendering it puts English on a Portuguese screen.

## Deferred, deliberately

**Client auth** has no rules here beyond rule 22's "the guard lives in one layout
route". What the guard reads, how a session is held on the client and how it is
refreshed belong with [`auth.md`](auth.md), which `project.yml` points the
**Auth** area at and which holds no rules yet.

**Runtime configuration** — how environment variables are declared, validated and
reached — has no rules here either. Rule 11 says the generated client is touched
in `lib/` and rule 16 says a port is built in `ports/` or `lib/`, which is where
config will land when it is written; nothing about its shape is decided.

Both gaps are on purpose. A rule invented here now would be a rule the auth pass
has to argue with.
