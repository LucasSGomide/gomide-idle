# Design rules

Rules for anything design-shaped. `project.yml` points every
`**Design**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

1. **A thing with no decision attached is filler.** Every stat, skill, item and
   hunt must answer "what choice does this create?" — this test is what removed
   gear, talents and tiers from the design that preceded the alpha.

2. **Complexity lives in one system at a time.** Two half-built systems teach you
   nothing about either one.

3. **Every "no" is a "not yet."** Cuts go to [`vision.md`](../vision.md) with the
   constraint they imply, so nothing here blocks them at the data-model level.

4. **Tune against a headless run of the simulator, never by playing.** Tuning by
   playing costs real hours per iteration; the same answer from a harness costs
   seconds, and the sim is already deterministic.

5. **Item variety comes from roll ranges, not affix combinations.** An affix that
   rolls +5% to +15% creates more chase than thirty distinct affix pairings, and
   costs far less to balance.

6. **Get one slot's numbers feeling right before generating the rest.** Six slots
   × six prefixes × five suffixes is 360 combinations you would otherwise be
   balancing blind.

7. **Linear gains against exponential costs stall.** An early model of the
   preceding design put its last zone at 1.8 million hours — the curve was wrong
   in a way that was invisible on paper.

8. **When two income sources multiply, cost growth must beat gain growth
   *squared*.** Otherwise alternating purchases outrun the price curve and the
   game finishes in 85 minutes; this was a real bug, not a hypothetical.

9. **Every rate mechanic needs a stated bottleneck.** Without one — a spawn cap, a
   cooldown, a timer — buying the same stat pays off forever and there is no
   regime where a different choice becomes correct.

10. **One player-hour produces one player's worth of XP and loot** — whatever the
    density, whatever the party size. Tier changes what drops and density changes
    which build wins; neither changes the rate, and party size changes nothing at
    all. Run every balance change against this before shipping it.

11. **Two modes promising equal XP per hour must also clear at equal speed.**
    Boss loot scales with clear time, so a slower mode would be punished twice
    for being slower.
