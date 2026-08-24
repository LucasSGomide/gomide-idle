# Goal: Research component-based game architecture and write a beginner's guide that ends with a concrete plan for applying it to a browser idle RPG

**Status:** executed 2026-08-22 — guide written to `docs/research/component-architecture-2026-08.md`
**Rating:** —
**Run:** standalone — no other prompt depends on it

## Context

I am building **gomide_idle**, a browser idle RPG in the Tibia visual idiom. You pick a
hunt, your character clears monster waves and a boss on its own, you come back to loot.
The play is not in watching the fight — it is in authoring *how* the character fights.

I have never built a game before. I am a backend engineer; I know TypeScript, layered
architecture, repositories and use cases well, and I know nothing about how games are
structured internally. I need to be taught the pattern from zero, not reminded of it.

The pattern I want researched is **component-based composition in the Unity / Godot
sense**: an entity is an object that owns a bag of components, and each component carries
both its own data and its own behaviour. I have already looked at ECS (entities as bare
ids, components as pure data, systems as functions over queries) and decided it is more
machinery than this project needs on a first game. Do not talk me back into ECS in the
main body of the guide — it gets its fair hearing in the alternatives section at the end,
and if that section concludes ECS is genuinely the better call, say so plainly there.

**What the game actually does, so the "apply it to my game" part can be concrete:**

- **Arena, not map.** A hunt is a small wall-free room on a 32×32 isometric tile grid,
  with a cap on how many monsters are alive at once. Entities have tile positions and
  never share a tile. Movement is "step one tile toward your target" — no pathfinding, no
  line of sight. Two monsters must never claim the same tile in one tick; tile reservation
  is resolved in a fixed deterministic order.
- **Skills carry a targeting shape.** Single target, radius ball, beam (`length` +
  `spread`), or cone. Example skills: *Claw Strike* hits three targets, *Bear Presence* is
  a persistent aura over a radius.
- **Offline progress is replay.** There is no offline formula. Being away ten hours means
  running those ten hours of real combat ticks, fast-forwarded, from a saved seed. This
  makes determinism a correctness requirement, not a nice property: one seeded PRNG whose
  seed and call counter live in the saved state, no `Math.random()`, no `Date.now()`
  inside the simulation, fixed-point integers instead of floats, and a CI test asserting
  that a repeated seed produces a byte-identical event stream.
- **The player authors behaviour with a priority list.** Skills go in an ordered list;
  each row carries one condition from a fixed vocabulary (my HP below X%, enemy count
  above X, I am in form Y, buff Z active). Each tick, the first row whose condition is
  true and whose cooldown is ready fires. FF12 gambits, essentially.
- **Modifiers are a list of sources, never a pre-summed number.** A character carries every
  modifier with its origin still attached (item, skill, buff, shapeshift form), so buffs
  expire correctly and the character sheet is explainable. Additive within a stat,
  multiplicative between stats.
- **Content is data, validated at load.** A new monster, item or hunt is a content edit,
  never a code change. Only a new *dimension* is a code change.
- **Stack.** TypeScript everywhere. NestJS 11 on Fastify for the server, which is
  authoritative — it owns state, the clock and the seed, and the client only sends intent
  and renders. The simulation itself is a standalone package with an **empty dependency
  list** and no side effects until one transactional write at the end; its core is roughly
  the pure function `runTicks(state, content, ticks)`. The client is React 19 + Vite 8,
  rendering an event stream the server pushes.

The result should leave me able to sit down and model my monsters, my player character,
my skills and my buffs as components without guessing, and knowing which mistakes to avoid.

## Constraints

1. **Assume zero game development knowledge.** Every game term is defined in plain words
   the first time it appears — entity, tick, game loop, update, spawn, system, scene graph,
   data-oriented. If a sentence needs a term I have not been given yet, define it first.
2. **Teach why the pattern exists before teaching the pattern.** Start with the problem it
   solves: the deep inheritance hierarchy (`FlyingFireMonster extends FireMonster extends
   Monster`) and exactly where it breaks. Show the broken version *first*, in code, then
   the composed version, so I can feel the difference rather than take it on faith.
3. **Include diagrams.** Use ASCII or Mermaid, never image links, so they survive being
   pasted into a repository file. At minimum: an entity holding its components; the tick
   loop and the order things happen inside one tick; and how a skill firing flows from the
   priority list through to damage landing on a target. Add more where a diagram beats a
   paragraph. Every diagram gets a sentence saying what to look at in it.
4. **Be explicit about what belongs in a component and what does not.** This is the part I
   most expect to get wrong. Give me a rule I can apply, plus worked examples of the three
   classic mistakes: a component that is really two components, logic that belongs in the
   entity or in a shared service instead, and components that need to talk to each other
   (and the accepted ways of letting them — direct reference, events, a mediator — with the
   trade-offs of each).
5. **Name real engines and real sources.** Say how Unity's GameObject/MonoBehaviour model
   and Godot's node model actually work, where they differ from each other, and where a
   plain TypeScript implementation should copy them and where it should not. Cite what you
   draw on — books, engine documentation, well-known articles — with enough detail that I
   can go read the original. Flag anything you are unsure of rather than smoothing it over.
6. **The application section must be concrete to this game, in TypeScript.** Not "you could
   have a Health component" — actual proposed component list for my player character, my
   monsters, my skills and my buffs, with TypeScript interfaces and a sketch of the tick
   loop. Show specifically how *Bear Presence*'s radius aura, *Claw Strike*'s three targets,
   tile reservation, and the gambit priority list each land in this model.
7. **Address determinism head-on.** Component-based composition is usually taught inside
   engines that do not care about reproducibility. Say where this pattern makes determinism
   harder — component update order, iteration over collections, anything implicitly ordered
   — and give the specific discipline that keeps `runTicks` reproducible. Also say whether
   this pattern fits a package with an empty dependency list and no side effects until the
   end, or whether it fights that.
8. **Say where the pattern stops paying off.** Honest limits: entity counts, deep component
   chains, performance characteristics in JavaScript specifically, and what the migration to
   something else would cost if I outgrow it. Tell me the signals to watch for.
9. **End with at most two alternative architectural patterns** that the game industry
   actually uses. For each: a short plain explanation, and a direct verdict on whether it
   would be a better fit than component composition *for this specific game* — a small
   deterministic server-side simulation, a handful of entities per arena, authored by rules
   rather than played by hand, written by someone building their first game. Do not hedge:
   pick a side per pattern and give the reasoning. ECS should be one of the two.
10. **No filler.** No "in today's fast-paced game development landscape", no restating the
    prompt back at me, no summary of what you are about to say before saying it.

## Tone

Direct and clear, like a patient teacher explaining to a beginner who is technically
competent but completely new to this domain. Short sentences. Plain words over jargon —
and when the jargon is the real name of the thing, use it once and immediately say what it
means in a few words. Concrete examples before abstract rules, always.

## Output

A single self-contained markdown document I can paste into `docs/research/` in my
repository. Headings, code blocks in TypeScript, ASCII or Mermaid diagrams — nothing that
depends on an external image or link to make sense. No length ceiling: as long as the
material genuinely needs, and no longer.
