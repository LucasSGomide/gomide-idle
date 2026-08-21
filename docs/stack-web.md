# Web stack rules

Rules for anything web stack-shaped. `project.yml` points every
`**Web stack**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

Settled 2026-08-21. The comparisons behind these choices are in
[`docs/research/web-stack-2026-08.md`](research/web-stack-2026-08.md);
this file carries the rule, that file carries the argument.

## Shell

1. **React 19 and Vite 8, TypeScript.** There is no React 20; Vite 8 ships
   Rolldown as its single bundler and is roughly an order of magnitude faster on
   cold builds.

2. **TanStack Query is the state manager for everything the server owns.** All
   truth is server-side by `alpha.md` decision 4, so a second client-side store
   holding the same data would be a cache of a cache.

3. **Add a router only when a screen needs a shareable URL.** Six screens and no
   SSR means a tab value is enough, and TanStack Router is a one-afternoon
   addition when that stops being true.

4. **Do not add Next.js, Redux, GraphQL, Server Components, a form library, a
   state-machine library, or the React Compiler.** Each solves a problem this app
   does not have, and the compiler in particular optimizes re-renders that the
   renderer boundary exists to avoid entirely.

5. **When the socket delivers data the meta UI already caches, write it into the
   Query cache directly rather than invalidating.** The payload is already in
   hand, so a refetch is a round-trip spent re-learning what was just pushed.

## The renderer

6. **Start on DOM plus CSS transforms, behind a small imperative
   `RendererPort`.** A dozen sprites is nowhere near a DOM limit, and the
   projection, depth sort and frame-index logic are renderer-agnostic — so the
   port is the entire switch cost.

7. **Port to PixiJS v8 the first time a per-sprite tint or blend is needed.** A
   red hit flash, a form-change glow or additive fire on Bear Presence is one
   line in Pixi and a compositor-layer promotion per node in DOM — and this is the
   signal that will actually fire.

8. **Never switch renderers because of sprite count.** The secondary signals are
   style-recalc above ~4ms per frame or more than ~150 live nodes in the
   viewport, and neither is reached by monsters alone — damage floaters get there
   first.

9. **Do not adopt Phaser.** It is a framework that wants to own the game loop and
   input, and the server owns the loop while the player presses nothing during a
   fight.

10. **Write the isometric projection and depth sort once, outside the renderer.**
    `screenX = (x - y) * TILE_W/2`, `screenY = (x + y) * TILE_H/2`, `depth = x + y`
    — correct for the whole alpha because one entity per tile means no multi-tile
    sprite ever needs a correction.

11. **Break depth-sort ties by entity id.** The server's ordering and the
    renderer's must agree, and stable ties are how that stays true.

12. **Drive the sprite frame index from the render loop, never from CSS
    `steps()`.** A CSS animation cannot be aligned to a server tick or
    interrupted by an event, which is the whole job here.

## Renderer and React

13. **The renderer owns one empty div and React never renders inside it.** Two
    systems writing the same DOM subtree is the single failure mode this boundary
    exists to prevent.

14. **Push data to the renderer imperatively through a ref, never through
    props.** A prop change is a React render, and the arena updates at frame rate.

15. **Do not use `@pixi/react`.** The scene graph is driven by a server event
    stream rather than React state, so a reconciler costs a per-frame render
    budget to buy nothing — the library's own maintainer names this case as the
    one for vanilla Pixi.

16. **Make renderer teardown survive StrictMode double-mounting.** Pixi v8's
    `init()` is async, so a naive effect can finish initializing after its own
    cleanup ran and leave an orphan canvas.

17. **The arena event stream never enters React state.** React must not re-render
    at frame rate, so events go from the socket to the `RendererPort` directly.

## Consuming the event stream

18. **Buffer two ticks and render deliberately in the past.** It guarantees both
    bracketing snapshots are in hand, which is what makes movement smooth rather
    than jittery.

19. **Interpolate positions in screen space, after projection; never interpolate
    events.** A hit or a death fires once when the render clock crosses its tick,
    and lerping tile coordinates before projecting diverges on turns.

20. **When more than ~10 ticks behind, snap rather than fast-forward.** Playing
    back four hours of hit flashes after a backgrounded tab is worse than showing
    the result, so keep only the events with lasting visual state.

21. **When the buffer starves, extrapolate at most two ticks, then freeze and say
    so.** Inventing a hit that the server never sent breaks the one guarantee the
    renderer has.

22. **Refuse to start the renderer on a protocol version mismatch.** A visible
    "reload, your client is out of date" screen is cheaper to diagnose than
    silently wrong rendering.

23. **Switch exhaustively on the event union with a `never`-typed default.**
    Adding an event type on the server then breaks the client's build, which is
    where that mismatch is cheapest to find.

## Look and components

24. **Only the arena carries the Tibia idiom; the meta UI is modern.** It is what
    Baiak Idle itself does, and it means off-the-shelf component defaults are a
    saving rather than a fight on the hardest screen in the game.

25. **Tailwind v4 plus copied-in primitives, not an installed component
    library.** Owning the file means deleting a default instead of overriding it
    through a theme engine.

26. **Keep `image-rendering: pixelated` scoped to sprites and the arena.** It is
    an arena rule, not a page rule, now that the meta UI is not pixel art.

27. **Build the item tooltip on a positioning engine, not a tooltip primitive.**
    Rolled prefix and suffix modifiers need collision-aware flipping at the
    inventory grid edge, must survive the pointer entering them, and need a
    tap-to-open path because hover does not exist on touch.

28. **Build the character sheet's modifier breakdown by hand from the source
    list.** The server sends where each modifier came from rather than a
    pre-summed number, so the view is a map over sources plus a running total.

## The priority list

29. **Ship the first version with no drag-and-drop library.** Ten rows reorder
    fine with move up/down plus `Alt+↑/↓`, which is perfect on touch and with a
    screen reader for zero dependencies and zero ARIA of your own.

30. **Treat a reorder as a server intent, not local state.** One request per
    action beats a drag gesture that has to be debounced and reconciled against a
    rejected response.

31. **When drag is added, use Pragmatic drag-and-drop with its accessibility
    package.** `@dnd-kit`'s stable line has not shipped since December 2024 and
    its current work is a pre-1.0 rewrite, so there is no version of it that is
    both current and stable — revisit if `@dnd-kit/react` reaches 1.0.

## Assets

32. **Serve sprites from the app's own origin for the alpha.** Zero
    infrastructure and one deploy; R2 earns its place when the set outgrows git
    or art needs updating without a code deploy.

33. **Content references a sprite by filename only, resolved through one
    manifest.** A name missing from the manifest then renders nothing instead of
    crashing, and the CDN base URL stays a config value.

34. **Keep sprite sheets as uniform grids while the DOM renderer is in use.** A
    packed atlas trims margins and may rotate frames, which is fine for Pixi and
    fatal for `background-position`.

35. **Adopt AssetPack the same day Pixi is adopted, not before.** Same vendor,
    same JSON format — one migration instead of two.

36. **Record every third-party asset under the REUSE specification, with a
    human-readable `CREDITS.md` reachable from inside the game.** CC-BY and
    OGA-BY require credit in the medium, not just in the repository.

37. **`OGA-BY` is not a valid SPDX identifier — record it as
    `LicenseRef-OGA-BY-3.0`.** A lint that fails two years later, when the source
    is forgotten, is the exact failure `alpha.md` warns about.
