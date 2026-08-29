# Superseded

Docs that were deleted, and why. Kept so a decision that was already made is not
re-litigated from an empty folder. Moved out of `README.md` on 2026-08-29, when
that file became the repo's operating guide.

## `design.md` and `roadmap.md` — deleted 2026-08-20

They described a different and much smaller game: three zones, two upgrade
buttons, no gear, no boss, no levels, and offline progress as a single
multiplication. The closed alpha is not a bigger version of that design; it is a
different one. Full text in git history at commit `8144bf3`.

Two design bugs the old balance script caught. Both are invisible on paper, and
both still matter when the alpha's curve gets tuned:

1. **Linear gains against exponential costs stall.** The first model put the last
   zone at 1.8 million hours.
2. **With two multiplicative income tracks, cost growth has to beat gain growth
   *squared*.** Alternating purchases otherwise outrun the price curve and the
   game finishes in 85 minutes.

## The three "research behind the rules" docs — deleted 2026-08-27

`docs/research/api-stack-2026-08.md`, `web-stack-2026-08.md` and
`renderer-2026-08.md`. Each argued for decisions that the rule docs already
carry, so the two drifted apart every time a rule was revised.

What decided each choice now sits in the header of the rule doc that owns it —
[`stack-api.md`](stack-api.md), [`stack-web.md`](stack-web.md). The full
arguments are recoverable with
`git log --full-history -- docs/research/<file>`.
