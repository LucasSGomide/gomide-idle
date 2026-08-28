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

Rules 28–30 were added later on 2026-08-26, when the text drawn inside the
canvas turned out to fall through every rule either file had. In the same pass
this file became the single home of the renderer boundary: `stack-web.md` rules
13 and 17 were rules 3 and 4 written a second time, and now cite them by number.

Rule 33 was added 2026-08-27 by the auth pass, and that pass revised rules 6,
11, 14–20 and 22 in place. The largest of those is the Ports section: ports are
gone, every dependency reaches a component as a hook, and the rules keep their
numbers with their old reasoning left visible.

## Dependency direction

1. **The renderer reads state and consumes events; it never computes a rule.**
   The moment the renderer knows a game rule, that rule exists in two places and
   the two will drift.

2. **The client's state is a cache, never the truth.** It is a view of what the
   server last said, so anything derived from it is a display value, not a
   decision.

## Renderer boundary

This file owns the boundary. `stack-web.md` rules 13 and 17 carried a
near-verbatim second copy of rules 3 and 4 until 2026-08-26; they are pointers
now, because what may write a DOM subtree is a dependency direction rather than
a tool choice. All four numbers stay alive — a roadmap item citing any of them
still lands somewhere true.

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
    session/              # the auth client's only consumer — see auth.md rule 4
    character/            # components, hooks, query keys for one screen-area
    hunt/
    inventory/
    gambit/
  renderer/               # Pixi and the RendererPort — no React, no game rule
  transport/              # socket client, event decoding
  ui/                     # copied-in primitives (button, tooltip, …)
  lib/                    # generated client and hooks, the fetch mutator, the
                          # auth client, i18n catalogues, config, utils
```

6. **Give `apps/web/src` those six folders, and put nothing beside them but
   the entry point and the three generated files — `stack-web.md` rule 38's
   route tree and rules 45 and 54's two theme outputs.** Every folder above
   answers "what belongs here" in one line, which is what a `components/` and a
   `utils/` stop doing about a week in — they become the two folders everything
   lands in when nowhere else is obviously right. *Revised 2026-08-27; this rule
   read "the two generated files" before rule 54's `theme.ts` existed. Both
   theme outputs sit at the root, so one generator has one destination.*
   *Revised again 2026-08-27: seven folders became six when `ports/` was
   retired. It held the `PortsProvider` and `usePorts` that rules 14–18 have
   since dropped — every dependency now reaches a component as a hook, so there
   is nothing left for that folder to hold.*

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

11. **Keep Orval's output in `lib/`, let a feature import the generated hook it
    needs straight from there, and write the fetch mutator — the one file that
    generated code calls — exactly once.** *Revised 2026-08-27; this rule read
    "import the generated API client only in `lib/`, and let `ports/` hand it out
    from there", reasoning that one import site is the one place a regeneration
    can break. That was written when a feature hand-wrote its hooks over an
    injected client. `stack-web.md` rule 57 now has Orval generate the hooks
    themselves, so a single import site is neither possible nor wanted — a
    regeneration is supposed to break at every call site whose endpoint
    changed.* What survives is the mutator: the base URL, `credentials`, and
    the 401 handling of [`auth.md`](auth.md) rule 26 all live in it, so a second
    one is a second configuration and the second one is always the one still
    aimed at the old host.

12. **Import the socket library only in `transport/`.** Decoding a frame and
    knowing which library delivered it are two jobs, and only one of them should
    have to change if rule 34 of `stack-api.md` is ever revisited.

13. **Keep a screen out of its route file: a route file wires a URL to a
    component and does not contain one.** A screen defined inside its route
    cannot be rendered by a test without booting the router.

## Hooks, not ports

*This section was rewritten 2026-08-27, and rules 14–19 keep their numbers and
their intent while their mechanism changed.* It described a `PortsProvider` at
the app root holding the generated API client, the socket and the clock, read
through `usePorts()`, where a **port** was "an interface for something outside
the app that the app does not control" — `architecture-api.md` rules 31 and 48's
word, pointed at the browser. That shape is dropped. `architecture-api.md` rule
59 has Orval generate the TanStack Query hooks from the OpenAPI document, and a
generated hook imports its fetch mutator at module scope, so it cannot take an
injected client — keeping the seam meant hand-writing, for every endpoint,
exactly what the generator already emits, plus a second set of query keys beside
the ones it produced. Every dependency now reaches a component as a hook, and
the only question about a hook is who wrote it: Orval, or us.

14. **Give a component its data through a hook — one Orval generated for a
    documented endpoint, one we wrote for everything else.** *Revised 2026-08-27;
    this rule read "Hold the app's ports in one `PortsProvider` at the root and
    read them with `usePorts()`", bought by "one place builds them, so a test
    builds different ones without touching a single import" and priced at "every
    test that renders anything: nothing works outside that provider". The
    provider and its price are both gone.* One shape for every dependency means
    a screen's data path reads the same whether the data came from the API, from
    the socket or from Better Auth, and there is no bag of ports whose contents
    a test has to know before it can render anything.

    ```tsx
    // features/character/use-character.ts — Orval's, re-exported
    export const useCharacter = useGetCharacter;

    // features/session/use-session.ts — ours; auth.md rules 4 and 23
    export function useSession() {
      return useQuery({ queryKey: sessionKeys.current(), queryFn: getSession });
    }

    // features/character/CharacterSheet.tsx
    const { data } = useCharacter(id);             // no client import
    ```

15. **Never let a component import the generated client, the auth client or the
    socket, or call `fetch` or `Date.now()`.** [`alpha.md`](../alpha.md) decision
    2 puts the clock on the server — "never `Date.now()` from the browser" — and
    a component that reaches the network itself can only be tested by faking the
    network around it. *Revised 2026-08-27: the auth client joined the list when
    [`auth.md`](auth.md) rule 4 gave it a home, and what a component holds
    instead is a hook rather than an injected port.*

16. **Build a client in `lib/` or `transport/`; a feature calls it through a
    hook and never constructs one.** A feature that builds its own client is a
    second configuration point, and the second one is always the one still aimed
    at the old base URL. *Revised 2026-08-27; this rule read "Build a port only
    in `ports/` or `lib/`; a feature receives one, never constructs one." The
    folder and the receiving both went with the provider — the limit on where a
    client is constructed did not.*

17. **Give a component exactly one way to get data: a feature hook.** A
    component that also calls a client directly has two data paths, and a test
    that fakes one of them redirects only that one. *Revised 2026-08-27: "reads
    a port directly" became "calls a client directly"; the rule is otherwise
    untouched.*

18. **Fake the network in a test, never a module.** *Revised 2026-08-27; this
    rule read "Swap a port in a test by wrapping `PortsProvider` with a fake,
    never by mocking a module", and only its first half died with the provider.*
    The ban stands for the reason it always had: a module mock is bound to a
    file path, so it survives the refactor that moves the file and quietly stops
    mocking anything, and `architecture-api.md` rule 74 draws the same line on
    the back end. `stack-web.md` rule 58 is the replacement answer — MSW at the
    network boundary, with handlers Orval generates from the same spec the hooks
    came from.

19. **Let the arena screen build the renderer and a test hand it a fake, and do
    the same for the socket.** *Revised 2026-08-27; this rule read "Keep the
    `RendererPort` out of `PortsProvider`; the arena screen builds it, and the
    exception is deliberate", justified by lifetime — `api`, `socket` and
    `clock` living as long as the app while a renderer binds to a mounted
    element and is destroyed with it (`stack-web.md` rule 16). There is no
    provider left to be an exception to, so what was an exception is now the
    pattern.* It also has a second subject: MSW cannot intercept Socket.IO,
    which speaks its own protocol over its own transport, so the socket is the
    one dependency rule 18's answer does not reach and it is handed in the same
    way.

## Data and query keys

20. **Take a query key from Orval's generated key builder, and hand-write one
    only where no generated hook exists — in that feature's `queries.ts`,
    beginning with the feature's folder name.** *Revised 2026-08-27; this rule
    read "Give every feature one `queries.ts` exporting a key factory, and begin
    every key in it with the feature's folder name", because "two features cannot
    collide when a folder name is unique by definition" and because `['hunt']`
    then clears one feature's caches and nothing else. `stack-web.md` rule 57's
    generated hooks come with their own keys, derived from the endpoint path, so
    a hand-written factory beside them would be a second name for the same cache
    entry — and the one that `stack-web.md` rule 5's socket writes would then be
    the wrong one half the time.* The generated keys are URL-shaped rather than
    feature-shaped, so an invalidation reads worse and prefix-matching is by
    path; that is the price. The exception the second half covers is real and
    small: the session (`auth.md` rule 19 keeps those routes out of the spec) and
    anything else with no documented endpoint behind it.

    ```ts
    // features/session/queries.ts — no generated hook exists for /api/auth/*
    export const sessionKeys = {
      all: ['session'] as const,
      current: () => ['session', 'current'] as const,
    };
    ```

21. **Let a route loader prefetch and guard; the component still takes its data
    from a feature hook.** A loader that returns data is a second cache with its
    own invalidation, and `stack-web.md` rule 2 keeps exactly one — so a loader
    warms the same query the hook will read rather than fetching beside it.
    `stack-web.md` rule 40 is how that is written.

22. **Put the auth guard in one layout route and nowhere else.** A guard repeated
    per route is a guard that is missing from the route added next week.
    *Revised 2026-08-27: what it checks is no longer deferred. It resolves the
    session before the protected screen renders and redirects with the target
    route in a search param — [`auth.md`](auth.md) rules 24 and 25, which are
    also what stop a session that is merely still loading from being drawn as a
    signed-out one.*

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

## Text in the arena

Added 2026-08-26. [`alpha.md`](../alpha.md)'s live-hunt view puts health bars
over every entity and floating damage numbers that distinguish physical from
fire from electric, so there are user-facing numbers rendered *inside* the
canvas. `stack-web.md` rules 54–56 are the tool half — the token module, the
bitmap font and the atlas that carries them.

28. **Keep i18next and the catalogues out of `renderer/`: the arena draws
    numbers, and a word reaches it as a finished string through the
    `RendererPort`.** [`alpha.md`](../alpha.md)'s arena is health bars and
    damage numbers — digits, not sentences — so the renderer has nothing to look
    up, and a translator injected into that folder would be exactly the
    dependency rule 10 exists to keep out, wearing a different name. The price
    is paid the first time the arena does need a word: whoever calls the port
    resolves it first, so a nameplate or a floating "Immune" is one more method
    on `stack-web.md` rule 7's port rather than something `renderer/` can build
    alone.

29. **Put every user-facing sentence in the HUD, never in the canvas.**
    `design.md` §1's 380px column is ordinary React beside the arena, and that is
    where react-i18next, the type scale and the theme's utilities already work; a
    sentence drawn into the canvas gets none of the three and is invisible to the
    screen reader `design.md` §9 commits to. The price: anything that wants to
    sit over an entity's head is positioned by the HUD from coordinates the
    renderer hands out, rather than drawn where it belongs.

30. **Take a colour, size or duration from the generated `theme.ts`
    (`stack-web.md` rule 54) anywhere CSS cannot reach it — `renderer/`
    included.** `stack-web.md` rule 46 forbids a raw colour in a component, and
    the arena is the one place that ban had no mechanism behind it, because a
    Pixi text style takes a number rather than a class. This is also the only
    import `renderer/` takes from another folder, and it is deliberate: rule 10
    keeps React and every game rule out of there, and a generated token module is
    neither.

## The content pack

Added 2026-08-27. `stack-web.md` rule 51 takes a hunt, monster, skill or affix
name from the content pack and `architecture-api.md` rule 87 keeps that name
untranslated — but nothing said where the browser reads it from.

31. **Import `libs/content` in `lib/`, and resolve a name from the id the server
    sent.** The gambit editor lists every skill the player could pick, including
    ones no payload has ever mentioned, so the client needs names that no
    response carries — and `stack-web.md` rule 33 already resolves a sprite
    filename from that same pack, so an entity's picture and its word come from
    one place. It is an import rather than a port (rule 14): a port stands in
    front of something the app does not control, and a JSON file compiled into
    the bundle is not that. The price is size and exposure — the whole pack
    ships to the browser, so monster stats and loot tables are readable in
    devtools, which is acceptable only because [`alpha.md`](../alpha.md)
    decision 4 makes the server authoritative and nothing in the pack is a
    secret.

32. **Do not version-check the browser's content pack against the server's, and
    render a name that will not resolve as its raw id.** `apps/web` and
    `apps/api` ship from one repository and deploy together, so the only window
    where the two disagree is between a deploy and a tab reload — too narrow to
    earn a second version integer beside `stack-api.md` rule 15's protocol one,
    which is the deliberate gap. What the player sees inside that window is the
    price: `ashfen-ghoul` where "Ashfen Ghoul" belongs, which is never an empty
    label and is searchable in a bug report, for the same reason rule 27 renders
    an error from its type rather than from a message.

## The session

Added 2026-08-27. [`auth.md`](auth.md) rule 4 gives `features/session/` the auth
client, which raises a question rule 7 would otherwise answer badly: every screen
has a signed-in player, and no feature may import another feature.

33. **Let only `routes/` and `features/session/` itself read the session.** Rule
    22's guard already guarantees a user for every screen beneath it, and
    `auth.md` rule 13 takes the acting user from the session on the server rather
    than from anything the client sends — so a feature that wants the current
    user is nearly always about to put it in a payload the server will ignore or
    must not trust. The chrome that genuinely shows who is signed in — the
    account menu, the sign-out control — hangs off a route file, which may import
    a feature freely, so rule 7 needs no exception. The price is a redirect for
    the rare screen that really does want the player's own name in its body:
    it asks the API for it like any other data.

## Deferred, deliberately

**Client auth** was deferred here and no longer is.
[`prompts/10-write-the-auth-rules.md`](prompts/10-write-the-auth-rules.md)
settled it on 2026-08-27: rule 22 now names what the guard reads, rules 14–20
were rewritten around hooks in the same pass, rule 33 says who may read the
session, and everything else — how the session is held, what a 401 does, how a
refused socket handshake is told apart from an expired session, and how
`stack-web.md` rule 53's signed-out language choice reaches the account — lives
in [`auth.md`](auth.md), which `project.yml` points the **Auth** area at.

**Runtime configuration** — how environment variables are declared, validated and
reached — has no rules here, and that gap is still on purpose. Rules 11 and 16
say where a client is built, which is where config will land when it is written;
nothing about its shape is decided. *Revised 2026-08-27: this paragraph pointed
at "a port is built in `ports/` or `lib/`" and at the generated client being
touched in `lib/`. Both rules changed in the same pass; the base URL and
`credentials` now live in rule 11's fetch mutator, which is the first piece of
runtime configuration the app will have.*
