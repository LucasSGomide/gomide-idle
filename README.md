# gomide_idle

A browser idle game, built to learn how browser idle games are built.

**Status:** design only. No code yet.

## The game, in one sentence

> Pick a zone. Your hero kills monsters there forever. Gold accrues. You spend it on Attack or
> Loot — and the best zone to be in changes as you get stronger.

Three zones, two upgrades, five formulas, no gear, no levels, no death. That's deliberate — see
the design principles at the bottom of [`design.md`](design.md).

## The docs

| File | What it is |
| --- | --- |
| [`design.md`](design.md) | **The whole game, one page.** Real numbers, no `TBD`. Start here. |
| [`roadmap.md`](roadmap.md) | Build order — what to build in what sequence, and what has to be decided first. |
| [`vision.md`](vision.md) | The parking lot. Everything cut, one bullet each. Nothing here is committed to. |
| [`docs/research/build-guide.md`](docs/research/build-guide.md) | Research notebook, written before any of this. Reference material, not a spec — parts of it describe a different repo. |

The rule that keeps these apart: **`design.md` is what gets built, `roadmap.md` is in what order,
`vision.md` is what doesn't (yet).** An idea moves between them by a deliberate edit, never by
drifting.

## Checking the balance

`design.md`'s numbers were checked by a balance script (`tools/balance.mjs`), since removed —
`roadmap.md` Step 3 calls for its XP-based successor before more than 2 zones ship. Until then,
re-check by hand after changing any number in `design.md`.

Two design bugs the original script already caught, both invisible on paper:

1. **Linear gains against exponential costs stall.** The first model put Zone 3 at 1.8 million
   hours.
2. **With two multiplicative income tracks, cost growth has to beat gain growth *squared*.**
   Alternating purchases otherwise outrun the price curve and the game finishes in 85 minutes.
