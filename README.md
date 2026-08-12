# gomide_idle

A browser idle game, built to learn how browser idle games are built.

**Status:** design only. No code yet.

## The game, in one sentence

> Pick a zone. Your hero kills monsters there forever. Gold accrues. You spend it on Attack or
> Loot — and the best zone to be in changes as you get stronger.

Three zones, two upgrades, five formulas, no gear, no levels, no death. That's deliberate — see
the design principles at the bottom of [`docs/design.md`](docs/design.md).

## The docs

| File | What it is |
| --- | --- |
| [`docs/design.md`](docs/design.md) | **The whole game, one page.** Real numbers, no `TBD`. Start here. |
| [`docs/vision.md`](docs/vision.md) | The parking lot. Everything cut, one bullet each. Nothing here is committed to. |
| [`docs/research/build-guide.md`](docs/research/build-guide.md) | Research notebook, written before any of this. Reference material, not a spec — parts of it describe a different repo. |
| [`tools/balance.mjs`](tools/balance.mjs) | The balance model. This is the spreadsheet the build guide asks for. |

The rule that keeps these apart: **`design.md` is what gets built, `vision.md` is what doesn't.**
An idea moves between them by a deliberate edit, never by drifting.

## Checking the balance

```sh
node tools/balance.mjs
```

No dependencies. It prints the zone crossover points, a simulated playthrough, and the
time-to-next-upgrade curve — which is the number that actually decides whether an idle game is
fun. Re-run it after changing any number in `docs/design.md`; the two must agree.

Two design bugs it already caught, both invisible on paper:

1. **Linear gains against exponential costs stall.** The first model put Zone 3 at 1.8 million
   hours.
2. **With two multiplicative income tracks, cost growth has to beat gain growth *squared*.**
   Alternating purchases otherwise outrun the price curve and the game finishes in 85 minutes.
