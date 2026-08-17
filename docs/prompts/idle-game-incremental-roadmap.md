# Goal: Produce a roadmap/architecture doc that sequences the idle game's build from a trivial v0 up to the intended dream v1

## Context
This is a solo, pre-code project: an idle game drawing on MuOnline, Tibia, WYD, and PoE2. The repo currently holds only research and design docs (`docs/vision.md`, `docs/design.md`, `docs/explorations/01-how-baiak-idle-works.md`, `docs/research/build-guide.md`, ~1400 lines total) — mostly research into reference games, with little of the actual game's own systems decided yet. No code exists.

The author knows Node.js, NestJS, JavaScript/TypeScript, and React, and is leaning toward Colyseus (multiplayer game server framework) and PixiJS (2D rendering) for this project, without having locked that choice in.

The problem to solve isn't "what's the dream game" (that's covered by existing docs) — it's sequencing: what minimal foundation to build first, and how to grow it step by step into the full game without hitting a point mid-roadmap where the early architecture has to be thrown away.

Produce one roadmap/architecture document. It should:
1. Define a foundation/architecture that is deliberately minimal at v0 but won't need a rebuild as complexity is added — in particular, keep the game logic structured as if server-authoritative (Colyseus-shaped: a room/state loop that could later run networked), even though v0 itself runs single-player in the browser.
2. Define an incremental sequence of steps from v0 to v1, where each step adds one dimension of complexity (e.g., more attributes, more items, more classes, more zones, gear comparisons, etc.) on top of the same core concept, never a different game.
3. For each step, call out what — if anything — needs a design decision or doc *before* that step is built, versus what can be figured out while coding it. The goal is to catch architecturally-defining decisions early (things that are expensive to change later) without slipping back into writing broad speculative docs for everything.

v0 itself is the smallest playable idle loop: one class, fighting one enemy type, gaining XP and loot — no gear choices, no multiple zones yet.

## Constraints
1. Documentation policy: don't write a new doc/spec for a system until code is about to need it — except for decisions that are architecturally defining (hard/expensive to change later, e.g. state shape, class/item data model, server-vs-client authority boundary). Those must be flagged and resolved before the step that depends on them, even if that means documenting slightly ahead of code.
2. v0 must be browser-only and single-player — no networking, no database, no auth in the first slice.
3. Despite v0 being single-player, the architecture must be shaped so that multiplayer can be added later without a rewrite (i.e., keep game-state logic separate from rendering/input, structured compatibly with a future Colyseus room even if Colyseus isn't wired in yet).
4. The roadmap must stay anchored to one shared core concept end-to-end — v0 and v1 are the same game at different levels of complexity, not a throwaway prototype followed by a separate "real" build.
5. Tech stack (Colyseus + PixiJS + Node/TypeScript) is a leaning, not locked — the roadmap doc should note it as the working assumption but flag it explicitly as a decision point in the "architecturally defining" category, since state-management choices depend on it.

## Output
A single markdown roadmap/architecture document (not code, not a build prompt). It should read as something to hand to a coding agent *later*, once accepted — this pass only produces the plan.
