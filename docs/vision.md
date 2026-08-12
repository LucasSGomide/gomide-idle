# Vision — the parking lot

Everything cut from 0.1.0, and everything wanted beyond it. One bullet each.

**This file exists so that "no" can mean "not yet" without the idea leaking back into
[`design.md`](design.md).** If you catch yourself designing something here, stop — write the one
line and go back to building.

Nothing in this document is committed to. Nothing here has a version number. When 0.1.0 is
actually playtested, the highest-value items get promoted based on what playtesting showed was
missing — not on what this file wants.

---

## Cut from 0.1.0 (was designed, then removed)

These were all fully specified once. The full text is in git history at commit `1e4685c`,
under `docs/systems/`, if the reasoning is ever needed again.

**Gear.** Three slots — weapon (1H or 2H), shield, armor — where equipping a two-handed weapon
locks the shield slot. That fork was the one standing build decision. Items as strict ladders
within a slot; the weapon the only Attack source, shield and armor the only Defense sources.
→ *Constraint:* item stats want to be a `{ attack, defense, … }` bag and `slot` a data field, so
adding a slot is a content edit plus a migration, not a redesign.

**Item tiers.** Normal → Superior → Perfect → Unique, dropping from bosses and weighted by zone
depth.

**Uniques.** One per boss, drop-only, ~Perfect stats plus **one rule-breaker** that changes how a
build works — a two-handed weapon that still allows a shield, a shield that converts Defense into
Attack. *A Unique that's only bigger numbers is a failed Unique.* These were what made zone choice
a chase rather than a ladder, and they were never designed — five rule-breakers was five systems.

**Set items.** Individually fine, build-defining together. Only means something with lots of gear.

**Talent tree.** ~12 talents, up to 5 ranks each, some gated behind spend-N-points thresholds,
one point per level to a cap of 50. Talents were meant to be *the ramp* — small, steady, always
something to click — against gear's spikes. Critically, the tree was where all the Attack/Defense
trade-offs lived, because gear had been deliberately emptied of them. It was never written.

**Defense as a stat.** The whole second axis. Attack decides whether you beat the timer, Defense
decides whether you survive. → *Constraint:* the stat model should extend past `{ attack }`
without a resolver rewrite.

**Waves, bosses and timers.** A run as `wave 1 → … → wave N → BOSS`, with one timer for the waves
and another for the boss, run length growing ~2 min in zone 1 to ~10 min in zone 5. Boss as the
only gear source. Timeout costing 25% of the run's banked XP.
→ *Constraint:* this is the thing that breaks closed-form offline progress. See `design.md`'s
offline section — the moment a run has internal structure, offline stops being one multiplication
and needs a real rate resolver plus a parity test against the live one.
→ *Constraint:* if monsters get individual attacks (not just a wave-clear timer), give each one a
tiny data record instead of code — `{element, min, max, chance, interval}`, one independent
probability roll per tick, no state machine. It costs nothing to leave unread today, and it's the
difference between a new monster being a content edit later versus a code change.

**Death and de-leveling.** Losing a % of gold and XP on death, enough XP loss dropping a level and
taking the talent point with it. Gear never lost. A per-account **Stop or Retry** setting, with no
guard rail — a player on Retry in a zone they can't beat loses levels overnight, by choice.
Deliberately harsh, MuOnline-flavoured. Required the game to state the risk loudly every time and
show de-levels first in the login summary.

**XP and levels.** Level cap 50, XP banked per kill, one talent point per level.

**Refinement.** Small permanent power steps paid in gold — the main gold sink. Open: max level,
whether it can fail or downgrade an item, gold vs. gold+material, whether Uniques can be refined.

**Respec.** Paid in gold, price escalating per respec, competing with refinement for the same pool.

**The login summary screen.** Time away, runs completed, runs timed out, deaths, XP, gold, gear
dropped — with de-levels shown loudly and first, and rare drops given disproportionate fanfare.
*This screen is the reward of an idle game and deserves real design attention.* 0.1.0 has a
degenerate version of it: "you earned N gold."

**Onboarding.** Pick a class → tutorial run → a **guaranteed** weapon drop from the tutorial boss →
equip it and the next run is visibly faster. The guaranteed drop teaches "gear changes everything"
in one loop. Worth rebuilding the moment gear exists.

**Zones 4 and 5.** 0.1.0 ships three.

---

## The dream (never designed, just wanted)

**Aesthetic.** MuOnline-inspired. Items visibly worn on the character. Gear glows to signal power,
and glow intensity scales with refinement level.

**Classes.** Every class has 3 specialization branches, mixable for hybrids or maxable for a pure
build. The v1 class was going to be a Druid (WYD-inspired) with **Beast Master** (summons packs,
tanks via shapeshifting), **Shapeshifter** and **Elementalist**. Only Beast Master was ever more
than a name. Whether every class can fill a tank role was explicitly undecided.

**Per-item attribute spreads,** so two items of the same tier are a genuine choice rather than a
bigger/smaller comparison. More slots: helmet, boots, gloves, then accessories once there are
stats worth putting on them.

**Deferred stats** the schema should tolerate: Speed (attack-speed multiplier), Accuracy vs.
Evasion, crit chance, elemental damage and resistances, class-specific vs. universal items, gear
durability and repair as a second gold sink.

**A visual layer.** Sprites, 4-frame animations, floating damage numbers, screen shake, easing on
every bar, a sound per meaningful event. Rare drops get disproportionate fanfare. The plan was a
React/DOM layer for everything configurable plus a small canvas viewport that only renders the
fight from the server's event stream — which is why `design.md` emits events from day one.

---

## Explicitly not wanted, so far

PvP, chat, guilds, trading, friends — anything social. Crafting. Prestige / reset-for-multiplier
loops. Achievements, daily quests, events.

These were framed as scope cuts rather than permanent rulings, but none of them has ever had a
reason to exist beyond "other idle games have it." That's not a reason.

---

## Ideas that arrive at the wrong time

Write them here. Don't build them.

| Idea | Date |
| --- | --- |
| | |
