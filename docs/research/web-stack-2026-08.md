# Web stack — the research behind the rules

Researched 2026-08-21. The rules live in [`docs/stack-web.md`](../stack-web.md);
this file is the argument.

## Versions as of 2026-08-21

| Package | Latest | Published |
| --- | --- | --- |
| react | 19.2.8 | 2026-07-21 |
| vite | 8.2.2 | 2026-08-20 |
| pixi.js | 8.20.0 | 2026-08-20 |
| phaser | 4.2.1 | 2026-07-09 |
| @tanstack/react-query | 5.101.4 | 2026-07-21 |
| @tanstack/react-router | 1.170.31 | 2026-08-19 |
| tailwindcss | 4.3.3 | 2026-07-16 |
| @atlaskit/pragmatic-drag-and-drop | 3.0.0 | 2026-08-14 |
| @dnd-kit/core | 6.3.1 | **2024-12-05** |
| @dnd-kit/react | 0.5.0 | 2026-06-11 |

**There is no React 20.** Vite 8 went stable 2026-03-12 with Rolldown as its
single bundler; Vite's own 19k-module benchmark went 40.1 s → 1.6 s.

## Renderer

> **Superseded 2026-08-24.** The staged plan below — start on DOM, move to
> Pixi when a tint is needed — was re-examined against Three.js, which this
> pass never considered. The conclusion is now PixiJS v8 from the first
> sprite; see [`renderer-2026-08.md`](renderer-2026-08.md). Everything else
> in this section, including the DOM limits and the projection formulas,
> still holds.

The load-bearing data point is already in this repo:
`docs/explorations/01-how-baiak-idle-works.md` §2 records that Baiak Idle ships
**PixiJS v8 for the fight viewport and plain HTML/DOM for everything else** —
2,439 `document.createElement` calls, zero React. Its sheet manifest is
`{file, frameW, frameH, directions, frames, walkStart, durations}` with
`frames: 9, directions: 4, walkStart: 1` — one idle frame plus an 8-frame walk
cycle per direction. That spec is worth copying field-for-field.

**Where DOM actually breaks down** — not where it is usually assumed to. The old
Build New Games "DOM Sprites" benchmark put the wall near 400 animated entities;
modern compositing moved that up, not down. At a cap of ~12 entities, sprite
count is a non-issue. The real limits are qualitative:

1. **Tinting and blending.** A red hit flash, a Werebear glow, additive fire on
   Bear Presence. DOM's only tools are `filter:` and `mix-blend-mode`, each of
   which promotes a compositor layer, and this is the most common source of jank
   in DOM-sprite games. Pixi does `sprite.tint = 0xff0000` for free. **This is
   the switch signal that will actually fire, and it will fire early.**
2. **Effect volume.** Damage floaters, not monsters, are what push the node count
   past a hundred.
3. **Per-frame style writes.** Fine at 12 nodes if you write only `transform` and
   `background-position` and never read from the DOM in the frame loop.
4. **Z-ordering is not a DOM weakness.** `z-index` on absolutely-positioned
   elements is a painter's algorithm and costs nothing here.

**Projection and depth sort are renderer-agnostic — write them once, outside:**

```
screenX = (tileX - tileY) * (TILE_W / 2)
screenY = (tileX + tileY) * (TILE_H / 2)     // TILE_H = TILE_W / 2 for 2:1 iso
depth   = tileX + tileY
```

That depth formula is correct for the *entire* alpha, because one entity per
tile means no sprite is ever wider than its tile — the usual multi-tile
`zPosition` correction does not exist here. Break ties by entity id so the
server's ordering and the renderer's agree.

**Phaser is the wrong shape.** It is a framework that wants to own the game loop,
scenes and input. The server owns the loop and the player presses nothing during
a fight — roughly 8% of Phaser would be used and the rest fought.

**Frame animation, per approach.** DOM: `background-position` off a uniform grid
plus `image-rendering: pixelated`, frame index driven from the render loop —
*not* CSS `steps()`, which is elegant for a looping idle but cannot be aligned to
a server tick or interrupted by an event, which is the entire job. Pixi:
`AnimatedSprite`, or set `texture.frame` directly for exact tick alignment.

## Renderer inside React

The pattern is: one component, a `useRef` on an empty div, a `useEffect` that
constructs the renderer and returns a real teardown, and everything afterwards
pushed imperatively through a ref.

Two traps:

- **StrictMode double-mounts in development** — setup, cleanup, setup. For a WebGL
  renderer that means creating and destroying a GL context immediately;
  react-three-fiber maintainers report the churn alone can trigger
  `CONTEXT_LOST_WEBGL` even with correct cleanup.
- **Pixi v8's `app.init()` is async**, so a naive effect can finish initializing
  *after* its own cleanup ran and leave an orphan canvas. Guard with a
  `cancelled` flag and destroy on the late path.

**`@pixi/react` was rejected.** v8 requires React 19+ and was rebuilt around an
`extend()` API, so v7 examples do not compile. More decisively, the maintainer's
own guidance says that if you are only using `<Application>` as a bootstrap
wrapper, use pixi.js directly in an effect — the custom reconciler adds
unnecessary overhead. The scene graph here is driven by a server event stream,
not React state, so a reconciler buys nothing.

It earns its place only if in-canvas UI becomes genuinely React-shaped — a
targeting overlay with popovers, an in-arena editor.

## Event-stream rendering

This is textbook **snapshot interpolation**; single-player versus multiplayer is
irrelevant, because the problem is "render at 60 fps from data arriving at N Hz".
Prior art is settled (Gaffer On Games, Valve's Source networking docs, Unity
Netcode).

```
renderClock = latestServerTick - INTERP_DELAY     // 2 ticks
alpha       = fract(renderClock)
pos         = lerp(project(snapA), project(snapB), alpha)
```

- **Interpolate positions, never events.** A hit or death fires once when the
  render clock crosses its tick; keep an ordered queue keyed by tick and drain it.
- **Lerp in screen space, after projection.** Same answer for straight lines,
  diverges on turns, and screen space is what sprite anchoring wants anyway.
- **Falling behind** (backgrounded tab, or an offline replay landing): past ~10
  ticks, **snap** — jump the clock, apply the final snapshot, drop every queued
  event except those with lasting visual state. Four hours of hit flashes is
  worse than the result.
- **Starved buffer:** extrapolate 1–2 ticks, then freeze and show a reconnecting
  state. Never invent a hit.

**Two version numbers, and conflating them is the classic mistake.**
`protocolVersion` is the shape of the stream — on mismatch, refuse to start the
renderer and show a reload screen, not a console warning. `streamSeq` is
monotonic per connection — a gap means resync with a full snapshot, never patch.
An unknown event type when the protocol version *matched* means the server lied,
so make it a hard error in dev; an exhaustive `switch` with a `never`-typed
default turns that into a build failure, which is where it is cheapest.

If the tick rate ever lands at ≥30 Hz with discrete one-tile-per-tick movement,
interpolation can be dropped entirely for a per-step CSS transition — which is
what most Tibia-like clients actually do.

## Shell

> **Two lines below are superseded 2026-08-26.** The router paragraph
> ("a tab value is defensible") was reversed: TanStack Router goes in from the
> first screen with file-based routes — `docs/stack-web.md` rules 3 and 38–40.
> And **an i18n library is no longer rejected**: English and Portuguese both
> ship in the alpha, on react-i18next, per `docs/stack-web.md` rules 48–52.
> Everything else in this section, including the arena-stream-is-not-Query
> nuance, still holds.

TanStack Query is the state manager, because all truth is server-side. The
nuance that matters: **the arena stream must not live in Query.** Query is
request/response cache semantics; the arena is a continuous stream the renderer
consumes directly. Let the socket write `setQueryData` for the meta state it
invalidates (level, XP, loot) and hand arena events straight to the renderer,
bypassing React.

Router: with ~6 screens and no SSR, a tab value is defensible. TanStack Router
over React Router 8 when a shareable URL is wanted — type-safe routes, built to
pair with Query.

Rejected: Next.js (no SSR, no SEO, fights a canvas), Redux/RTK, GraphQL, RSC, a
state-machine library, an i18n library, a form library, and the React Compiler —
which optimizes exactly the re-renders the renderer boundary exists to avoid.

tRPC becomes attractive if the backend is TypeScript in the same monorepo, which
it is; it is what Baiak Idle uses for its account API. Deferred rather than
rejected — it competes with the OpenAPI/Orval workflow the backend standards
already assume.

## Priority list

The surprise: **`@dnd-kit`'s stable line has not shipped since December 2024**
(19.8M weekly downloads, `@dnd-kit/core` 6.3.1), while every 2026 "best of" guide
still names it. Its maintainer's actual current work is `@dnd-kit/react` 0.5.0, a
pre-1.0 ground-up rewrite that is not backwards-compatible. Not abandonment —
but there is no version that is both current and stable right now.
`react-beautiful-dnd` has been deprecated by Atlassian since 2022.

Pragmatic drag-and-drop is the alternative: core under 4.7 kB, framework
agnostic, powers Jira/Trello/Confluence, 3.0.0 shipped 2026-08-14, with keyboard
support in a separate `-react-accessibility` package. It is headless, so the drop
indicator and animation are yours to build.

**None of it is needed for v1.** Ten rows reorder fine with move up/down buttons
plus `Alt+↑/↓`: zero dependencies, perfect on touch, perfect with a screen reader
without writing a single ARIA live region — and because a reorder is a *server
intent*, it maps to one request per action instead of a drag gesture that has to
be debounced and reconciled against a rejected response.

## Look

Every component library ships an opinion — rounded corners, soft shadows, system
font, generous padding, smooth easing — and all of it is wrong for a Tibia-like.
That is the case *for* copy-in components over an installed library: you delete
the `rounded-md` instead of overriding it through a theme engine.

But the alpha put only the arena in the Tibia idiom, and Baiak Idle's own HUD is
plain DOM rather than pixel art — so stock defaults become a free win on the meta
UI, and `image-rendering: pixelated` stays scoped to sprites.

**Item tooltips are the one careful spot.** Showing rolled prefix and suffix
modifiers on hover is a *rich* tooltip: it needs collision-aware flipping at the
inventory grid edge, must survive the pointer entering it (so `title` and CSS
`:hover` are out), and needs a tap-to-open fallback because hover does not exist
on touch. Use a positioning engine directly, not a label-shaped Tooltip
primitive.

## Assets

Cloudflare R2 is $0.015/GB-month with **$0 egress**, served from Cloudflare's PoPs
with no separate CDN layer; S3 is $0.023/GB plus $0.09/GB egress and needs
CloudFront on top. R2 is the obvious pick *when* it is needed — which is not yet.
For the alpha, `/public` on the app's origin is zero infrastructure and one
deploy. Move when the sprite set outgrows git (say >100 MB) or art needs updating
without a code deploy.

**The atlas trap:** a packed atlas trims transparent margins and may rotate
frames. Pixi handles that from the JSON; CSS `background-position` cannot, since
it requires a uniform grid. So uniform grids while on DOM, and adopt PixiJS
AssetPack the same day Pixi is adopted — same vendor, same format, one migration
instead of two.

**Licensing.** The REUSE specification 3.3 is the machine-checkable answer: a
`LICENSES/` directory holding full texts named by SPDX identifier, per-file
`SPDX-FileCopyrightText` / `SPDX-License-Identifier` headers, `.license` sidecars
for PNGs, or a single `REUSE.toml` covering directories by glob. `reuse lint`
verifies it in CI.

Verified against the SPDX list: `CC0-1.0`, `CC-BY-4.0`, `CC-BY-3.0` and
`CC-BY-SA-4.0` are valid identifiers. **`OGA-BY` is not** — it must be recorded
as `LicenseRef-OGA-BY-3.0` with its text in
`LICENSES/LicenseRef-OGA-BY-3.0.txt`.

`REUSE.toml` is what lints; `CREDITS.md` is what actually satisfies CC-BY and
OGA-BY, which require credit *in the medium* — so it has to be reachable from
inside the game, not only from the repository. Record the source URL and author
alongside the licence id, because the licence alone is not enough to write the
attribution line later.
