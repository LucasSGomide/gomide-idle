# The arena renderer — the research behind the rules

Researched 2026-08-24. The rules live in [`docs/stack-web.md`](../stack-web.md);
this file is the argument.

This reopens a decision that was already made. `docs/stack-web.md` rules 6–9
said: start the arena on plain DOM, move to PixiJS the first time a colour
effect is needed, never switch because of sprite count, never adopt Phaser. The
argument behind them is in
[`docs/research/web-stack-2026-08.md`](web-stack-2026-08.md). **Three.js was
never considered** — it appears nowhere in that file — so this pass puts three
candidates on the table as equals: Three.js, PixiJS v8, and the DOM plan that
currently holds the field.

## Versions as of 2026-08-24

| Package | Latest | Published | Ships its own types? |
| --- | --- | --- | --- |
| three | 0.185.1 (r185) | 2026-07-01 | No — `@types/three` |
| @types/three | 0.185.4 | separate package | — |
| pixi.js | 8.20.0 | 2026-08-20 | Yes (`lib/index.d.ts`) |

| Signal | three | pixi.js |
| --- | --- | --- |
| GitHub stars | 114,756 | 48,066 |
| npm downloads, week of 2026-08-17 | 14,259,444 | 1,012,891 |
| Last commit | 2026-08-24 | 2026-08-24 |
| Open issues | 374 | 339 |
| Full-package size, minified | 726 kB | 900 kB |
| Full-package size, gzipped | 182 kB | 258 kB |

Both are alive and were touched the same day this was written. Recent three.js
releases: r180 2025-09-03, r181 2025-11-19, r182 2025-12-10, r183 2026-02-20,
r184 2026-04-16, r185 2026-07-01 — roughly every six to ten weeks. PixiJS
publishes its minors on GitHub (8.19.0 on 2026-06-04, 8.20.0 on 2026-08-20) and
its patches on npm.

Sizes come from Bundlephobia and describe importing the *whole* package. Neither
number is what actually ships: both libraries drop unused code at build time, so
the delivered figure depends on what is imported. Treat these as an upper bound
and note the direction of the surprise — **the 3D library is the smaller one**,
because PixiJS v8 carries two graphics back-ends, a vector drawing system, a text
engine and a filter system in the box.

## Ten words, first

Everything below uses these. Each is defined once here and used plainly after.

| Word | What it means |
| --- | --- |
| **Texture** | An image sitting in the graphics card's memory, ready to be drawn. |
| **Sprite** | One flat picture drawn at a position on screen. A monster is a sprite. |
| **Sprite sheet** | One big image holding many small frames in a grid — every walk frame of a monster in a single file. |
| **Atlas** | A sprite sheet plus a data file saying where each frame sits. A *packed* atlas also trims empty space and may rotate frames to fit, so the frames are no longer on a tidy grid. |
| **Frame loop** | A function the browser calls ~60 times a second. Everything that moves, moves there. |
| **Draw call** | One instruction handed to the graphics card. Fewer is faster; each one has fixed overhead. |
| **WebGL / WebGPU** | The two browser interfaces for talking to the graphics card. WebGL is the old, universal one; WebGPU is the new, faster one. |
| **Canvas** | A single HTML element that libraries draw pixels into. From the outside it is one opaque rectangle. |
| **Tint** | Multiplying a colour over a sprite. A red tint on a monster for 100 ms is the standard "it got hit" flash. |
| **Blend mode** | How a sprite's pixels combine with what is already behind it. *Additive* blending adds light instead of covering — how fire and glows are drawn. |
| **Scene graph** | A tree of things to draw. Move a parent, the children move with it. |

Two more, needed only for the Three.js section:

- **Mesh, geometry, material** — Three.js's vocabulary for a drawable thing: a
  *geometry* is a shape (for 2D, a flat rectangle), a *material* says how it is
  coloured, and a *mesh* is the two bolted together and placed in the world.
- **Orthographic camera** — a camera with no perspective. Things do not shrink
  with distance. It is how you make a 3D engine look flat.

## What the three candidates actually are

**Three.js is a 3D engine.** It gives you a world with three axes, cameras,
lights, materials and meshes. Drawing a flat picture is something you *arrange*
it to do — point an orthographic camera at a plane and switch the lighting off.
It is by a wide margin the most used graphics library on the web, and almost all
of that use is 3D.

**PixiJS is a 2D sprite renderer.** It has one job: put flat pictures on screen
fast, in a tree, with colour and blending. There is no camera, no light, no
material. Version 8 rewrote the internals for WebGPU, keeping WebGL as an
automatic fallback.

**The DOM plan is not a library at all.** Every monster is a `<div>` with a
sprite sheet as its background image. Movement is a CSS `transform`; the current
animation frame is a `background-position`; the drawing order is `z-index`. The
browser's own layout engine is the renderer.

## The six jobs the arena actually needs

From `alpha.md` and `docs/architecture-web.md`. Verdict per candidate.

| Job | DOM | PixiJS v8 | Three.js |
| --- | --- | --- | --- |
| Red flash on hit, additive fire glow | Painful | **One line** | Workable |
| Crisp pixel-art scaling | One CSS line | One setting | One setting |
| Sprite-sheet frames, driven by the frame loop | Manual, workable | **Built in** | Build it yourself |
| Draw the back row first | Free | **Built in** | Fiddly |
| Floating damage numbers | Free (HTML) | **Built in** | Needs a third-party library |
| 20–150 moving things | Fine | Fine | Fine |

**1. Tint and blending.** This is the whole decision, so it goes first. In
PixiJS, `sprite.tint = 0xff0000` and `sprite.blendMode = 'add'`, and in v8 both
are inherited down the tree the same way position is — set them on a container
and every child gets them. In Three.js, tinting works too: the material carries a
colour that multiplies over the texture, and additive blending is a material
flag. It is more setup, but it is not a weakness. In DOM there is no tint. The
nearest tools are the CSS `filter` and `mix-blend-mode` properties, each of which
forces the browser to promote that element onto its own compositor layer — the
most common source of stutter in DOM sprite games. **DOM loses this one badly;
the two graphics libraries are close.**

**2. Pixel-art scaling.** By default, enlarging a 32×32 sprite blurs it. All
three fix it in one setting: CSS `image-rendering: pixelated`, PixiJS's `nearest`
scale mode, Three.js's `NearestFilter`. **A tie.**

**3. Sprite-sheet frames.** The requirement, from `docs/stack-web.md` rule 12, is
that the frame index is driven by the render loop and can be interrupted by an
event — a CSS animation cannot be aligned to a server tick. PixiJS ships this:
`Assets.load()` reads an atlas file, and `AnimatedSprite` takes the frames
straight out of it with `sheet.animations['walk']`, `animationSpeed`, `play()`,
`gotoAndStop(n)` and an `onFrameChange` callback. DOM does it by hand — one
`background-position` write per frame — which is a few lines, but locks the asset
pipeline to *uniform grids only*, because a packed atlas that trims and rotates
frames cannot be expressed as a background offset. Three.js has no sprite-sheet
support at all: you set a texture's `offset` and `repeat` yourself, frame by
frame, and write your own frame table. The community answer is a third-party
library (`twopoint5d`) that adds the 2D layer three.js does not have. **PixiJS
wins, DOM is second at the cost of a constraint on your art files, Three.js is
last.**

**4. Drawing order.** In an isometric view the entity further back must be drawn
first. In DOM this is free — `z-index` on absolutely positioned elements is
exactly a back-to-front painter's order. In PixiJS it is `container.sortableChildren`
plus a `zIndex` per sprite: the same painter's order, built in. In Three.js it is
the awkward one, because a 3D engine's natural answer is a depth buffer that
tests per pixel — the wrong tool for stacked transparent cut-outs. You end up
disabling depth testing and controlling `renderOrder` by hand, which is doable
and is the kind of thing you get wrong twice before getting it right. **DOM and
PixiJS tie, Three.js is last.**

**5. Damage numbers.** `docs/research/web-stack-2026-08.md` already identified
these as the thing that pushes the node count up, not monsters. In DOM they are
just HTML — free, and they get real text layout. PixiJS has `Text` and
`BitmapText` in the box. Three.js has **no text at all**; drawing a word requires
either painting it to a hidden 2D canvas and uploading that as a texture, or
adding `troika-three-text`, a third-party package that generates font atlases in
a web worker. That is a real, well-known gap, not a nitpick. **DOM and PixiJS
tie, Three.js needs a dependency to print a number.**

**6. Throughput at 20–150 entities.** All three are fine, and this is the point
`docs/stack-web.md` rule 8 already makes: none of these is chosen or rejected on
speed at this scale. The old DOM-sprite benchmarks put the wall near 400 animated
elements, and modern browsers moved that up. **A tie, and it stays a tie —
performance is not what decides this.**

## Fitting the boundaries that are already fixed

`docs/architecture-web.md` and `docs/stack-web.md` rules 13–21 fix the shape:
the renderer owns one `div` and React never renders inside it; the arena event
stream never becomes React state; data is pushed imperatively through a ref;
positions are interpolated in screen space *after* the isometric projection; the
client renders two ticks behind the server; and teardown must survive React
StrictMode mounting the component twice in development.

None of the three candidates fights any of this, because all three are driven
imperatively from outside React. The differences are small and worth knowing:

- **Both graphics libraries create one `<canvas>` inside the div.** That is the
  boundary honoured perfectly — React physically cannot render into a canvas.
  DOM is the leakier one: the renderer's elements are ordinary DOM, so the
  boundary is a rule people keep rather than a wall.
- **Interpolating in screen space suits all three.** After projection you have an
  x and a y in pixels. That is a CSS `transform`, a PixiJS `sprite.position`, or
  a Three.js `mesh.position` with the third axis unused.
- **StrictMode is a live hazard for both graphics libraries, in the same way.**
  Creating and destroying a graphics context immediately is exactly the churn
  that three.js's React community reports as a cause of lost contexts, and
  PixiJS's `init()` is asynchronous, so a careless setup can finish *after* its
  own cleanup ran and leave an orphan canvas behind. The fix is the same for
  both — a `cancelled` flag, and destroy on the late path — and it is already
  written down as rule 16. **DOM has no equivalent hazard**, which is one honest
  point in its favour.

**Conclusion: the fixed boundaries do not choose between the candidates.** They
were written renderer-agnostic on purpose, and they held.

## What a solo developer actually pays

| Cost | DOM | PixiJS v8 | Three.js |
| --- | --- | --- | --- |
| Code to a first moving sprite | Least | Small | Most |
| New concepts to learn | ~0 | ~6 | ~12 |
| Added download | 0 | ≤258 kB gz | ≤182 kB gz |
| TypeScript types | N/A | In the package | Separate package |
| Debugging | Browser devtools | PixiJS Devtools extension | Weakest |
| Asset pipeline | Uniform grids only | AssetPack, same vendor | Roll your own |
| Help available | Universal | Good, 2D-specific | Huge, but 3D-specific |

**Concepts.** PixiJS asks you to learn `Application`, `Assets`, `Texture`,
`Sprite`, `Container` and `Ticker`. That is roughly six ideas, and every one of
them maps onto something the arena already has. Three.js asks for scene, camera
(and which projection), renderer, geometry, material, mesh, texture filtering,
render order, depth testing and the frame loop — before you have drawn a monster.
For a game that is flat, most of that vocabulary exists to describe a dimension
this game does not use.

**TypeScript.** PixiJS ships its own definitions inside the package, so the
version you install is the version you get types for. Three.js does not; types
live in `@types/three`, a separate package on a separate version line (0.185.4
against the library's 0.185.1). This is a small, permanent friction — two
packages to bump together, and a window after every three.js release where they
disagree.

**Help, and the popularity trap.** Three.js is used fourteen times more than
PixiJS. That advantage does not transfer here, because nearly all of it is 3D:
tutorials, forum answers and the model an AI assistant has absorbed are about
loading GLTF models, physically-based materials, shadows and post-processing.
Searching for "three.js isometric sprite sheet" lands you on forum threads and a
third-party library, not on documentation. PixiJS's smaller community is aimed
squarely at this problem. There is a real counter-risk on the PixiJS side and it
should be named: **v8 broke the v7 API**, so older tutorials and a fair amount of
AI-generated code will be written against v7 and will not compile. Check any
PixiJS snippet against the v8 migration guide before trusting it.

**Debugging.** The strongest argument for DOM is that a `<div>` monster can be
inspected in the browser's element panel, while a canvas is one opaque rectangle.
PixiJS closes most of that gap with PixiJS Devtools, a Chrome and Firefox
extension that shows the scene tree, lets you edit properties live, outlines the
selected node in the viewport, and exposes it as `$pixi` in the console.
Three.js's equivalent tooling is the weakest of the three.

## The 3D question, which is the whole Three.js case

Three.js is a 3D engine. Everything it offers beyond PixiJS — cameras you can
move through a world, lighting, shadows, 3D models, post-processing — is
capability this game does not use, and by the project's own answer, never will:
the look is 32×32 isometric sprites permanently, in `alpha.md` and in
`vision.md`.

Strip the 3D away and what is left is a general-purpose renderer being asked to
do 2D work it has no built-in support for. Every one of the six jobs above that
Three.js loses, it loses for the same reason: sprite sheets, painter's-order
drawing and text are 2D problems, so a 3D library has no opinion about them and
hands them back to you. Three.js's genuine wins here are a smaller download and a
much larger community, and neither survives contact with the detail — the
download gap is small and both libraries tree-shake, and the community is large
about a different subject.

**Conclusion: Three.js is rejected.** It would be the right answer if this game
ever wanted a camera that moves in three dimensions, lighting, or 3D models. It
does not, so choosing it means paying a 3D engine's conceptual cost, writing the
2D layer yourself, and adding a text dependency, in exchange for capability that
is never switched on.

## The real contest: DOM now, or PixiJS now

With Three.js gone, the live question is the one rules 6 and 7 already answered:
start on DOM and switch to PixiJS when a colour effect is needed, or start on
PixiJS.

The existing argument for DOM-first is good and should be stated at full
strength. A dozen sprites is nowhere near a DOM limit. The isometric projection,
the depth sort and the frame-index logic are renderer-agnostic and get written
once outside the renderer either way, so the `RendererPort` — the small
imperative interface the rest of the app talks to — is the entire cost of
switching later. Nothing about DOM has to be learned. And it defers a dependency
until it is proven necessary, which is usually right.

Three things break it.

**1. The switch signal is not a maybe — it is scheduled.** Rule 7 fires "the
first time a per-sprite tint or blend is needed", and
`docs/research/web-stack-2026-08.md` already predicted, in its own words, that
this "is the switch signal that will actually fire, and it will fire early". The
alpha spec is why: the Beastmaster changes form, Bear Presence burns everything
within a radius, crits land, monsters take hits. A fight that shows none of that
is not a testable fight — the player's entire job is watching the rules work.
A migration you have already scheduled is not a deferral, it is a detour.

**2. The DOM path taxes the art pipeline, not just the code.** Rules 34 and 35
exist only to support it: sprite sheets must stay uniform grids because
`background-position` cannot express a packed atlas, and AssetPack adoption waits
for PixiJS adoption. So the DOM detour reaches past the renderer and constrains
how the art is stored, for a renderer that is planned for deletion. The
throwaway is not the adapter — the adapter is small. The throwaway is the
pipeline decision around it.

**3. The learning happens either way, and later is worse.** Picking DOM does not
avoid learning PixiJS; it moves that learning to the moment there is a working
game to avoid breaking, which is the more expensive moment. Six new concepts is a
day, not a sprint, and the debugging gap that used to justify starting on DOM is
now largely covered by PixiJS Devtools.

The one cost of going straight to PixiJS is real and should be accepted openly:
the very first arena — static sprites at tile positions, no effects — genuinely
is faster to build in DOM, and PixiJS's asynchronous startup inside React
StrictMode is a trap you will hit on day one. Rule 16 already tells you how to
get past it.

**Conclusion: adopt PixiJS v8 from the first sprite, and keep the
`RendererPort` anyway.** The port stops being a migration plan and becomes what
it should always have been — the wall that keeps game rules out of the renderer,
and the seam that makes the renderer testable without a browser.

## Recommendation

**PixiJS v8, from the first sprite.**

It is a 2D sprite renderer for a 2D sprite game. Tint and additive blending, the
effects this arena needs first, are one property each. Sprite sheets, animation
playback, painter's-order drawing and text are in the box. Its types ship with
it, it has a working scene inspector, its asset tooling is by the same authors,
and the project shipped a release four days before this was written. The one
thing it is not is the smallest download, and that is the trade being made.

**What would reverse this:**

- **The game wants real 3D** — a camera that moves through the world, lighting,
  or 3D models. Then Three.js, and the whole comparison is re-run.
- **The arena turns out to need no colour effects at all** — no hit flash, no
  form glow, no fire aura, ever. Then DOM-first is right again, because rule 7's
  trigger never fires and the dependency is never justified.
- **PixiJS stops shipping.** Not the case today — 8.20.0 on 2026-08-20, last
  commit the day this was written — but it is a smaller project than Three.js and
  worth re-checking at each major version.

Phaser stays rejected for the reason `docs/research/web-stack-2026-08.md` gives:
it is a framework that wants to own the game loop and input, and the server owns
the loop while the player presses nothing during a fight.
