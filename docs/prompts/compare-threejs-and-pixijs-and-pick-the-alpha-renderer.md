# Goal: Compare Three.js, PixiJS and the current DOM renderer, and recommend which one the closed alpha should draw its arena with

**Status:** executed 2026-08-24 — PixiJS v8 picked from the first sprite; `docs/stack-web.md` rules 6–9, 34 and 35 revised, argument in `docs/research/renderer-2026-08.md`
**Rating:** —
**Run:** standalone — reopens `docs/stack-web.md` rules 6–9, which it is allowed to overturn

## Context

`gomide_idle` is a browser idle RPG. The one screen that needs a real renderer
is the arena: a small isometric room of 32×32 pixel-art sprites — one character
or monster per tile — animating off a server-sent event stream while the player
edits rule lists next to it. Everything else in the app is ordinary HTML.
`alpha.md` is the spec; its **Graphics** and **Foundational decisions** sections
are the ones that bind.

The renderer question is already answered on paper, and the answer may be wrong.
`docs/stack-web.md` rules 6–9 say: start on plain DOM with CSS transforms behind
a small imperative `RendererPort`; port to PixiJS v8 the first time a per-sprite
tint or blend is needed; never switch because of sprite count; do not adopt
Phaser. `docs/research/web-stack-2026-08.md` carries the argument behind those
rules. **Three.js was never evaluated** — it appears nowhere in the repo. So the
existing decision was made without one of the two libraries in this comparison
ever being on the table, which is why it is reopened here.

The person reading this has a strong back-end background and no game-development
or graphics-programming background. They have not used either library. The
deliverable has to teach as it argues: someone who has never written a draw call
should finish it understanding what each library actually is, what it does for
you, what it leaves you to do, and why one of them wins here.

## Constraints

1. Define every graphics or game-development term the first time it appears —
   sprite, sprite sheet, atlas, tint, blend mode, scene graph, draw call, WebGL,
   canvas, frame loop, texture. One short plain-language definition, inline. Never
   use an abbreviation without spelling it out first.
2. Judge three candidates as equals: **Three.js**, **PixiJS v8**, and the
   **current DOM + CSS transforms plan**. The incumbent is a contender, not a
   default — it has to win on the same evidence as the other two.
3. The research is allowed to overturn `docs/stack-web.md` rules 6–9. If it does,
   say exactly which rule is wrong and why the argument in
   `docs/research/web-stack-2026-08.md` does not hold.
4. **The game is 2D permanently.** 32×32 isometric sprites, now and in
   `vision.md`. There is no future need for a movable camera, lighting, or 3D
   models. Weigh Three.js on what it does for a 2D sprite game, not on 3D
   capability the project will never use — and if that makes the conclusion
   short, say so plainly rather than manufacturing balance.
5. The renderer must fit boundaries already fixed by `docs/architecture-web.md`
   and `docs/stack-web.md`, which are not up for debate: the renderer owns one
   `div` and React never renders inside it; the arena event stream never enters
   React state; data reaches the renderer imperatively through a ref, never
   through props; positions are interpolated in screen space after projection;
   the client renders two ticks in the past; teardown must survive React
   StrictMode's double-mount. Score each candidate on how much work it is to
   honour these, and name any candidate that fights them.
6. Score each candidate on the concrete jobs this arena needs, with a short
   verdict per job: per-sprite tint (a red flash on hit) and additive blending (a
   fire glow for Bear Presence); crisp pixel-art scaling with no blurring;
   playing sprite-sheet frames driven by the render loop rather than by CSS;
   depth-sorting entities so the one further back draws first; damage numbers
   floating over the arena; and roughly 20–150 moving things on screen at once.
7. Also compare the practical costs a solo developer pays: how much code stands
   between nothing and a first moving sprite; how steep the learning curve is for
   someone new to graphics; download size added to the app; TypeScript support
   quality; documentation quality; how alive the project is (last release,
   release cadence, maintainer count) as of August 2026; the asset pipeline each
   one expects; and how much help exists — tutorials, Stack Overflow answers, and
   whether an AI assistant is likely to write correct code for it.
8. Every factual claim about a library carries its version number and the date it
   was checked. `docs/research/web-stack-2026-08.md` already does this — match it.
9. End with **one** recommendation, not a menu. Then state the conditions that
   would reverse it: what would have to become true about this game for the
   losing candidate to be right.
10. Do not reopen decisions outside the renderer. Server-authoritative
    simulation, seeded replay, React 19, Vite 8, TanStack Query and Tailwind v4
    are settled.
11. If the recommendation changes rules 6–9, write the replacement rule text
    ready to paste: numbered, one bolded imperative plus one line of why, matching
    the existing style. Append new rules rather than renumbering existing ones —
    roadmap items cite rules by number.

## Tone

Direct and clear, teacher to beginner. Short sentences, plain words, no jargon
left undefined. Explain the reasoning rather than asserting the conclusion — the
reader should be able to disagree with a step, not just accept the ending. No
hedging and no filler.

## Output

Two files:

1. **`docs/research/renderer-2026-08.md`** — the comparison and the argument,
   written in the shape of `docs/research/web-stack-2026-08.md`: a version and
   check-date table at the top, then one section per decision, each ending in a
   stated conclusion. This file carries the *why*.
2. **`docs/stack-web.md`** — edited so rules 6–9 match the conclusion. This file
   carries the *rule*: one imperative, one line of why, nothing else.
