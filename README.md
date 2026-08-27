# gomide_idle

A browser idle RPG in the Tibia visual idiom, built to be played by other people.

**Status:** design only. No code yet.

## The game, in one sentence

> Pick a hunt. Your character clears the waves and the boss on its own. You come back to
> loot — and the thing you actually play is the rule list that decides how it fights.

## The docs

| File | What it is |
| --- | --- |
| [`alpha.md`](alpha.md) | **The closed alpha, one page.** The spec plus the four decisions the build rests on. Start here. |
| [`vision.md`](vision.md) | The parking lot. Everything wanted but not in the alpha, one bullet each. Nothing here is committed to. |
| [`docs/`](docs/) | The planning system — roadmap items, task breakdowns, explorations, and one rule doc per area. See [`project.yml`](project.yml) for the map. |
| [`docs/research/build-guide.md`](docs/research/build-guide.md) | Research notebook, written before any of this. Reference material, not a spec — parts of it describe a different design. |
| [`docs/explorations/01-how-baiak-idle-works.md`](docs/explorations/01-how-baiak-idle-works.md) | Teardown of a shipped, commercial-scale game in this exact genre. The most useful document in the repo. |

The rule that keeps these apart: **`alpha.md` is what gets built, `docs/roadmap/` is in
what order, `vision.md` is what doesn't (yet).** An idea moves between them by a deliberate
edit, never by drifting.

## Superseded

`design.md` and `roadmap.md` were deleted on 2026-08-20. They described a different and
much smaller game — three zones, two upgrade buttons, no gear, no boss, no levels, and
offline progress as a single multiplication. The closed alpha is not a bigger version of
that design; it is a different one. Full text in git history at commit `8144bf3`.

The three "research behind the rules" docs — `docs/research/api-stack-2026-08.md`,
`web-stack-2026-08.md` and `renderer-2026-08.md` — were deleted on 2026-08-27. Each argued
for decisions that the rule docs already carry, so the two drifted apart every time a rule
was revised. What decided each choice now sits in the header of the rule doc that owns it
(`docs/stack-api.md`, `docs/stack-web.md`), and the full arguments are recoverable with
`git log --full-history -- docs/research/<file>`.

Two design bugs the old balance script caught, both invisible on paper and both still worth
knowing when the alpha's curve gets tuned:

1. **Linear gains against exponential costs stall.** The first model put the last zone at
   1.8 million hours.
2. **With two multiplicative income tracks, cost growth has to beat gain growth *squared*.**
   Alternating purchases otherwise outrun the price curve and the game finishes in 85
   minutes.
