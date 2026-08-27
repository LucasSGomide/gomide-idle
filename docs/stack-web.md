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

Rules 6–9, 34 and 35 were revised 2026-08-24 after Three.js, PixiJS and the
DOM plan were compared head to head — see
[`docs/research/renderer-2026-08.md`](research/renderer-2026-08.md). The
renderer no longer starts on DOM.

Rules 38–52 were added 2026-08-26, and rule 3 was reversed in the same pass —
the router, the test runner, the token pipeline and the language rules, written
before the code they govern. Structure and dependency direction live in
[`architecture-web.md`](architecture-web.md), which was numbered on the same
day; where a rule needs both halves it is written once and cited from the other
file by number.

Rules 53–56 were added later on 2026-08-26, and rules 8, 12, 13, 17, 26 and 51
were revised in the same pass — the arena's text, the token path into it, the
pre-auth language switcher, and a sweep of the rules that were still arguing
with the DOM renderer rules 6 and 34 cancelled. Rules 13 and 17 became pointers:
they were `architecture-web.md` rules 3 and 4 written a second time, and the
boundary is structure, so that file owns it.

## Shell

1. **React 19 and Vite 8, TypeScript.** There is no React 20; Vite 8 ships
   Rolldown as its single bundler and is roughly an order of magnitude faster on
   cold builds.

2. **TanStack Query is the state manager for everything the server owns.** All
   truth is server-side by `alpha.md` decision 4, so a second client-side store
   holding the same data would be a cache of a cache.

3. **TanStack Router from the first screen, with file-based routes.** Every
   screen is a URL, so a reload, the back button and a pasted link all land
   where the player was, and a typed `$huntId` is a checked value rather than a
   string that happens to parse. *Revised 2026-08-26; this rule previously said
   "add a router only when a screen needs a shareable URL", reasoning that six
   screens and no SSR meant a tab value was enough and that TanStack Router was
   a one-afternoon addition when that stopped being true. The afternoon is real
   and the arithmetic was right, but it was an argument for deferring a decision
   whose answer was already known — and it did not count what the deferral
   costs: a screen written before the router is a screen with no URL, so
   retrofitting one is not adding a file, it is revisiting that screen's state,
   its loading behaviour and every link into it.* Rule 38 names what going in
   now costs.

4. **Do not add Next.js, Redux, GraphQL, Server Components, a form library, a
   state-machine library, or the React Compiler.** Each solves a problem this app
   does not have, and the compiler in particular optimizes re-renders that the
   renderer boundary exists to avoid entirely.

5. **When the socket delivers data the meta UI already caches, write it into the
   Query cache directly rather than invalidating.** The payload is already in
   hand, so a refetch is a round-trip spent re-learning what was just pushed.

## The renderer

6. **Render the arena with PixiJS v8 from the first sprite.** A red hit flash, a
   form-change glow and additive fire on Bear Presence are one property each in
   Pixi and impossible in DOM without a compositor-layer promotion per node — so
   a DOM stage is a detour with a scheduled end date, not a deferred dependency.

7. **Keep the renderer behind a small imperative `RendererPort` anyway.** With
   one implementation the port stops being a migration plan and becomes the wall
   that keeps game rules out of the renderer, and the seam that lets the
   projection, depth sort and frame-index logic be tested without a browser.

8. **Never choose or reject a renderer, or a change inside one, on sprite
   count.** Every candidate is comfortable at 20–150 entities, so the count
   decides nothing. *Revised 2026-08-26. The why previously read: "the DOM
   ceiling — ~150 live nodes, or style-recalc above ~4ms per frame — is reached
   by damage floaters rather than monsters, and decides nothing here." That
   arithmetic measured the DOM plan rules 6 and 34 cancelled, and nobody can
   reach it now.* The imperative outlives its own reasoning because the same
   worry comes back inside PixiJS wearing different clothes — pool the floaters,
   cull the off-screen sprites, split the container — and the answer has not
   changed: at this scale the number is a guess, and a frame budget is measured
   or it is not known.

9. **Do not adopt Three.js or Phaser.** Three.js is a 3D engine, so a
   permanently 2D game pays its whole vocabulary and still writes the sprite
   sheet, drawing order and text layers itself; Phaser is a framework that wants
   to own the game loop and input, and the server owns the loop.

10. **Write the projection and depth sort once, outside the renderer.**
    `screenX = x * TILE_W`, `screenY = y * TILE_H`, `depth = y` — an orthogonal
    top-down grid at 32×32, correct for the whole alpha because one entity per
    tile means no multi-tile sprite ever needs a correction. *Corrected
    2026-08-24:* this rule previously carried the isometric diamond projection,
    `screenX = (x - y) * TILE_W/2`. `alpha.md` said "32×32 isometric", which is
    two incompatible things — Tibia is an orthogonal top-down grid and a real
    isometric tile is 64×32. `alpha.md` § Graphics settled it as orthogonal.

11. **Break depth-sort ties by entity id.** The server's ordering and the
    renderer's must agree, and stable ties are how that stays true.

12. **Drive the sprite frame index from the render loop — `gotoAndStop(n)`,
    never `play()`.** A frame clock the renderer does not own cannot be aligned
    to a server tick or interrupted by an event, which is the whole job here.
    *Revised 2026-08-26; this rule previously read "never from CSS `steps()`",
    which was the DOM plan's version of that mistake and is unreachable now that
    rules 6 and 34 chose PixiJS.* Pixi's `AnimatedSprite.play()` is the same
    mistake rebuilt in the new renderer: a timer of its own, running beside the
    tick clock, with `onFrameChange` reporting to nobody who can interrupt it.

## Renderer and React

13. **See [`architecture-web.md`](architecture-web.md) rule 3: the renderer owns
    one element and React never renders inside it.** *Revised 2026-08-26; this
    rule carried its own near-verbatim copy of that boundary — "The renderer owns
    one empty div and React never renders inside it. Two systems writing the same
    DOM subtree is the single failure mode this boundary exists to prevent." Both
    copies were true and neither was the owner, so the boundary now lives in one
    file and this number points at it.* The boundary is a dependency direction
    rather than a tool choice, which is what puts it in that file and not this
    one.

14. **Push data to the renderer imperatively through a ref, never through
    props.** A prop change is a React render, and the arena updates at frame rate.

15. **Do not use `@pixi/react`.** The scene graph is driven by a server event
    stream rather than React state, so a reconciler costs a per-frame render
    budget to buy nothing — the library's own maintainer names this case as the
    one for vanilla Pixi.

16. **Make renderer teardown survive StrictMode double-mounting.** Pixi v8's
    `init()` is async, so a naive effect can finish initializing after its own
    cleanup ran and leave an orphan canvas.

17. **See [`architecture-web.md`](architecture-web.md) rule 4: the arena event
    stream never enters React state.** *Revised 2026-08-26, with rule 13 and for
    the same reason; this rule previously read "React must not re-render at frame
    rate, so events go from the socket to the `RendererPort` directly", which is
    that file's rule 4 in different words.* Rule 14 is this file's half — the ref
    is how the data gets there.

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

26. **Set the arena's textures to the `nearest` scale mode, and leave
    `image-rendering` at its default everywhere in the DOM.** Crisp pixel
    scaling is an arena rule, not a page rule, now that the meta UI is not pixel
    art. *Revised 2026-08-26; this rule previously read "Keep
    `image-rendering: pixelated` scoped to sprites and the arena". That is a CSS
    property, so it was written for the DOM renderer rules 6 and 34 cancelled —
    under PixiJS the arena is a single `<canvas>` element and a canvas has no
    per-sprite CSS, so the same setting is a texture scale mode set in
    `renderer/`.* The DOM half survives as the default it always was:
    `design.md` §6 cites this rule to keep item icons and character portraits
    unpixelated even where their source art is pixel art, and that half is
    unchanged.

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

34. **Use packed atlases from the start — sprite sheets need not be uniform
    grids.** Pixi reads trimmed and rotated frames straight from the atlas JSON;
    the uniform-grid constraint existed only to keep CSS `background-position`
    workable, and no DOM renderer is being built.

35. **Adopt AssetPack alongside Pixi, not later.** Same vendor, same JSON
    format — one pipeline instead of two.

36. **Record every third-party asset under the REUSE specification, with a
    human-readable `CREDITS.md` reachable from inside the game.** CC-BY and
    OGA-BY require credit in the medium, not just in the repository.

37. **`OGA-BY` is not a valid SPDX identifier — record it as
    `LicenseRef-OGA-BY-3.0`.** A lint that fails two years later, when the source
    is forgotten, is the exact failure `alpha.md` warns about.

## The router

Added 2026-08-26, alongside rule 3's reversal.

38. **Generate the route tree from the files in `routes/` with
    `@tanstack/router-plugin`, commit `routeTree.gen.ts`, and never hand-edit
    it.** A route that exists because its file exists cannot be forgotten in a
    registration list, and the generated tree is what makes a link's target and
    its params typed. The price is a codegen step in the build: this is the
    second generated file in the repo after Orval's client, rule 45 adds a
    third, and none of the three can be trusted until the generator has run —
    so a fresh clone type-checks against a stale tree until `pnpm dev` or the
    generate script has run once.

39. **Name route files by TanStack Router's own conventions: `__root.tsx` for
    the shell, a leading underscore for a layout that adds no path segment, `$`
    for a parameter.** The file path is the URL, so "what is at `/hunt/42`" is
    answered by listing a directory instead of reading a configuration file.
    `architecture-web.md` rule 22 is why the guard is one `_authed.tsx` rather
    than a check repeated per route.

    ```
    routes/
      __root.tsx
      _authed.tsx                # guard
      _authed/characters.tsx
      _authed/hunt.$huntId.tsx
    ```

40. **Pass the `QueryClient` into the router's context so a loader can reach
    it.** `architecture-web.md` rule 21 lets a loader prefetch but never fetch,
    and `ensureQueryData` is how that is written — which needs the client the
    app already has rather than a second one built for the router.

    ```ts
    export const Route = createFileRoute('/hunt/$huntId')({
      loader: ({ context, params }) =>            // prefetch only
        context.queryClient.ensureQueryData(huntQuery(params.huntId)),
      component: HuntScreen,
    });
    ```

## Testing

Added 2026-08-26. `architecture-api.md` rules 70–86 are the back end's testing
rules; these are the web's, and they are shorter because there is less here that
can be silently wrong.

41. **Vitest and React Testing Library on the web — and this is a second test
    runner in one repository, deliberately.** Vitest reads the same
    `vite.config.ts` the app builds with, so path aliases, the TSX transform and
    `import.meta.env` are already correct and the test config is a few lines;
    reaching the same place with Jest means a second transform pipeline plus a
    hand-written module map that drifts silently the day `vite.config.ts`
    changes. `stack-api.md` rule 32 keeps Jest for `apps/api` and the `libs/`
    packages — so the repo runs two runners, with two mocking
    vocabularies (`vi.fn()` here, `jest.fn()` there) and two configurations to
    keep current. That is the price, and it is paid because the web's runner
    should be the one that already understands the web's build.

42. **Test the ports seam, the projection and depth sort from rule 10, the event
    buffer from rules 18–21, and every feature hook.** These are the parts that
    go wrong quietly: a projection off by half a tile still looks like a game, a
    starved buffer renders something rather than nothing, and a feature hook is
    where the query key and the port meet — the two things
    `architecture-web.md` rules 14 and 20 exist to keep straight.

43. **Never assert on the canvas; assert on the calls made to the
    `RendererPort`.** Reading pixels back out of a WebGL context to prove a
    sprite moved is slow, flaky, and tests PixiJS rather than this project —
    rule 7's port is a list of instructions, and a list of instructions is a
    thing you can compare.

44. **Give the pure logic no DOM at all, and use jsdom only where a component or
    a hook renders.** Rule 7 keeps the projection, the depth sort and the frame
    index outside the renderer precisely so they are plain functions; handing
    those files a jsdom they never touch is startup cost per test file, forever.

## Design tokens

45. **Generate `apps/web/src/theme.css` from
    [`docs/design-tokens.json`](design-tokens.json), commit the output, and have
    CI regenerate it and fail on any difference.** `design.md` already declares
    the JSON correct and the prose stale when the two disagree, so the Tailwind
    v4 theme should be derived from it rather than typed a second time. The
    price: a third generated file nobody may hand-edit (after Orval's client and
    rule 38's route tree), and the JSON-path-to-custom-property mapping —
    `color.accent.default` → `--color-accent`, `spacing.5` → `--spacing-5` — is
    a convention that lives in the generator and has to be read to be known.

46. **Never write a raw colour, size, radius or duration in a component; use the
    theme's utilities.** A hex typed into a component survives the next token
    change, and `design.md` §3's contrast table is only true of the values in
    the token file.

47. **Edit a copied-in primitive in place; do not wrap it.** Rule 25 copies the
    file in exactly so a default can be deleted instead of overridden, and a
    wrapper re-adds the layer the copy removed. `architecture-web.md` rule 9 is
    the one limit on that editing: a primitive in `ui/` may not learn about a
    feature.

## Language

Added 2026-08-26. English and Portuguese both ship in the alpha.
[`docs/research/web-stack-2026-08.md`](research/web-stack-2026-08.md) lists an
i18n library among the things rejected — that line is superseded by the rules
below, and the research file carries a note saying so.

48. **react-i18next 17 and i18next 26, with English and Portuguese from the
    first screen.** Two languages from the start is what avoids a retrofit pass
    over every string ever rendered, and this is the option with by far the
    deepest ecosystem — language detection and lazy catalogue loading are
    configuration rather than code. Its failure mode is the price and it is the
    opposite of what rule 23 buys elsewhere: keys are ordinary strings, so a
    typo renders the key on screen instead of failing a build. Rules 49 and 50
    are how that is bought back.

49. **Type the catalogue — declare `CustomTypeOptions['resources']` as
    `typeof en`, and set `returnNull: false`.** The declaration is the only
    thing that turns rule 48's runtime miss back into a compile error, and it
    costs one `react-i18next.d.ts`; `returnNull: false` makes a key's type
    `string` rather than `string | null` at every call site, which is the
    difference between a label and a `??` at each one. The catalogues live in
    `lib/i18n/` — they are chrome only, because rule 51 keeps every content name
    out of them.

50. **Declare the Portuguese catalogue `satisfies typeof en`, with English as
    the source.** react-i18next's fallback would otherwise put an English string
    on a Portuguese screen and never say so — found by a player rather than by
    the build.

51. **Take a hunt, monster, skill, prefix or suffix name from the content pack,
    never from the i18n catalogue — and never translate it.** Those names are
    authored data, and `architecture-api.md` rule 11 requires that adding a
    monster be a content edit; putting its name in the client's catalogue would
    make every new monster a code change in a second package.
    `architecture-api.md` rule 87 is the other half — a content name is one
    English string, the same one on a Portuguese screen. *Revised 2026-08-26;
    this rule previously read "from the content pack's locale map" and closed
    with "`libs/content` validates the map at load, so a missing language fails
    exactly where a missing skill id already does". There is no locale map:
    content names are not translated, so a name is a plain string and there is
    nothing per-language left to validate.*

52. **Keep the active language on the account and out of the URL, mirrored into
    `localStorage`.** The route tree stays as rule 39 describes it with no locale
    segment and no param on every link, and a link pasted between friends opens
    in the reader's own language rather than the sender's. The price is the
    first paint: nothing on the client knows the language until the account query
    resolves, so the `localStorage` mirror is read synchronously at startup and
    is the only reason a returning Portuguese player does not see one English
    frame.

53. **Let a signed-out screen write the language to `localStorage` alone, and
    carry that choice onto the account at sign-up.** Rule 52 keeps the active
    language on the account, and the login screen has no account yet — while a
    player who cannot read that screen is exactly the one who needs the
    switcher, which is why `design.md` §13 puts one in its top bar. The price is
    one setting with two write paths: sign-up has to pass the local choice
    through, or the player picks a language once before the form and again after
    it.

## The arena's text

Added 2026-08-26. `alpha.md`'s live-hunt view needs health bars over every
entity and floating damage numbers that tell physical from fire from electric —
so there are user-facing numbers rendered *inside* the canvas, which rules 45
and 46 cannot reach and rules 48–52 do not translate.
[`architecture-web.md`](architecture-web.md) rules 28–30 are the structural half:
what may be drawn there, and what `renderer/` is allowed to import.

54. **Generate `apps/web/src/lib/theme.ts` from
    [`docs/design-tokens.json`](design-tokens.json) with rule 45's generator and
    on rule 45's terms — committed, regenerated in CI, failing on any
    difference.** A Pixi text style takes a number (`0xF97316`), not a Tailwind
    utility and not a CSS custom property, so `renderer/` cannot read the theme
    rule 45 emits — and without a second output the three `damageType` colours
    are typed a second time inside the renderer, putting the hole in rule 46's
    ban on raw colours exactly where the game's most-read numbers are drawn. The
    price: a fourth generated file nobody may hand-edit, after Orval's client,
    rule 38's route tree and rule 45's `theme.css`, plus a hex-to-`0x`
    conversion the generator now owns. It is emitted into `lib/` rather than
    beside the folders, which is what keeps `architecture-web.md` rule 6's count
    of root files true.

55. **Draw arena text with a bitmap font — a font shipped as an image of
    pre-drawn characters — through Pixi's `BitmapText`, never `Text`.** `Text`
    builds one texture per distinct string, so `-127` and `-128` are two uploads
    and the damage floaters are the highest-churn text on the screen, where
    `BitmapText` reuses a single glyph sheet instead. It is also what rule 24's
    arena idiom asks for — a smooth vector face over 32×32 pixel art is the one
    place that idiom visibly breaks, and it is why `design.md` §2's Rajdhani and
    Inter stop at the canvas edge. Two prices: a second font asset, whose licence
    is recorded under rules 36 and 37 like every other; and a bitmap sheet holds
    only the glyphs baked into it — digits, minus and per cent today — so the day
    a word is drawn in the arena, its accented characters have to be in the sheet
    already or they render blank.

56. **Bake the arena font and the three damage-type icons through AssetPack,
    into the same atlas as the sprites.** Rule 35 already chose that pipeline;
    `design.md` §9 forbids carrying the physical/fire/electric distinction on
    colour alone, and a Lucide icon is an SVG rendered in the DOM — it cannot be
    drawn into a canvas, so the arena needs its own small copies of `swords`,
    `flame` and `zap`. The price is three glyphs duplicating a decision made
    elsewhere: if `design.md` §3 ever swaps `flame` for a different icon, the
    arena's copy does not follow on its own.
