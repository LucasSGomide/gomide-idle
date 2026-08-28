# Vision — the parking lot

Everything wanted beyond the closed alpha. One bullet each.

**This file exists so that "no" can mean "not yet" without the idea leaking back into
[`alpha.md`](alpha.md).** If you catch yourself designing something here, stop — write the one
line and go back to building.

Nothing in this document is committed to. Nothing here has a version number. When the alpha is
actually playtested, the highest-value items get promoted based on what playtesting showed was
missing — not on what this file wants.

> **Updated 2026-08-20.** The section below was written against the old `design.md` — a much
> smaller game, since deleted (see [`README.md`](README.md)). Several things it lists as *cut*
> are now in the closed alpha; those are marked inline. The rest still stands.

---

## Cut from the old 0.1.0 design (was designed, then removed)

These were all fully specified once. The full text is in git history at commit `1e4685c`,
under `docs/systems/`, if the reasoning is ever needed again.

**Gear.** *(in the alpha, reshaped — six slots with prefix/suffix rolls rather than three slots on a ladder. See [`alpha.md`](alpha.md).)* Three slots — weapon (1H or 2H), shield, armor — where equipping a two-handed weapon
locks the shield slot. That fork was the one standing build decision. Items as strict ladders
within a slot; the weapon the only Attack source, shield and armor the only Defense sources.
→ *Constraint:* item stats want to be a `{ attack, defense, … }` bag and `slot` a data field, so
adding a slot is a content edit plus a migration, not a redesign.

**Item tiers.** *(partly in the alpha — Common and Uncommon only.)* Normal → Superior → Perfect → Unique, dropping from bosses and weighted by zone
depth.

**Uniques.** One per boss, drop-only, ~Perfect stats plus **one rule-breaker** that changes how a
build works — a two-handed weapon that still allows a shield, a shield that converts Defense into
Attack. *A Unique that's only bigger numbers is a failed Unique.* These were what made zone choice
a chase rather than a ladder, and they were never designed — five rule-breakers was five systems.

**Set items.** Individually fine, build-defining together. Only means something with lots of gear. Completing a set will unlock new outfits, this way the item is not needed to be reflected directly on the character. Still need to find a way to display the glow when refining items.

``` md
                +----------------------------+
                |   Player Equips an Item    |
                +--------------+-------------+
                               |
                               v
                +----------------------------+
                |  Trigger Checking Script   |
                +--------------+-------------+
                               |
            Is the FULL SET equipped? (Helm + Armor + Legs + Boots)
                               |
              +----------------+----------------+
              |                                 |
           [ YES ]                           [ NO ]
              |                                 |
              v                                 v
+----------------------------+    +----------------------------+
| 1. Force Outfit Change     |    | 1. Revert to standard body |
|    to "Dragon Set" ID      |    |    or cosmetic outfit      |
| 2. Apply Custom Set Bonus  |    +----------------------------+
| 3. (Optional) Spawn Wing   |
|    visual addon            |
+----------------------------+
```

**Wings.**

**Talent tree.** *(in the alpha, reshaped — one skill point per level spent on class skills, each levellable ten times.)* ~12 talents, up to 5 ranks each, some gated behind spend-N-points thresholds,
one point per level to a cap of 50. Talents were meant to be *the ramp* — small, steady, always
something to click — against gear's spikes. Critically, the tree was where all the Attack/Defense
trade-offs lived, because gear had been deliberately emptied of them. It was never written.

**Defense as a stat.** *(in the alpha — Physical Defence plus Fire and Electric resistances.)* The whole second axis. Attack decides whether you beat the timer, Defense
decides whether you survive. → *Constraint:* the stat model should extend past `{ attack }`
without a resolver rewrite.

**Waves, bosses and timers.** *(waves and bosses are in the alpha; timers and the timeout penalty are not. The offline constraint below was answered — offline replays the real ticks, see [`alpha.md`](alpha.md).)* A run as `wave 1 → … → wave N → BOSS`, with one timer for the waves
and another for the boss, run length growing ~2 min in zone 1 to ~10 min in zone 5. Boss as the
only gear source. Timeout costing 25% of the run's banked XP.
→ *Resolved:* this is the thing that broke closed-form offline progress, and the alpha answers it
by never being closed-form — offline replays the real ticks with a seeded RNG, so there is one
resolver, not two. See [`alpha.md`](alpha.md).
→ *Constraint:* if monsters get individual attacks (not just a wave-clear timer), give each one a
tiny data record instead of code — `{element, min, max, chance, interval}`, one independent
probability roll per tick, no state machine. It costs nothing to leave unread today, and it's the
difference between a new monster being a content edit later versus a code change.

**Death and de-leveling.** *(partly in the alpha — death costs XP and one destroyed gear piece, and
the Stop/Retry setting ships. De-levelling does not, and "gear never lost" was overturned. See
[`alpha.md`](alpha.md) § Death.)* Losing a % of gold and XP on death, enough XP loss dropping a level and
taking the talent point with it. Gear never lost. A per-account **Stop or Retry** setting, with no
guard rail — a player on Retry in a zone they can't beat loses levels overnight, by choice.
Deliberately harsh, MuOnline-flavoured. Required the game to state the risk loudly every time and
show de-levels first in the login summary.
→ *Constraint:* store XP as one absolute total and derive the level from it. Stored as "level plus
progress within level", de-levelling later is a data migration; derived, it is a balance change.

**XP and levels.** *(in the alpha — cap 30, one skill point per level.)* Level cap 50, XP banked per kill, one talent point per level.

**Refinement.** Small permanent power steps paid in gold — the main gold sink. Open: max level,
whether it can fail or downgrade an item, gold vs. gold+material, whether Uniques can be refined.

**Respec.** *(in the alpha, free — see [`alpha.md`](alpha.md) § Progression. Reallocating skill
points costs nothing and is allowed outside an arena, because the alpha has no gold to price it
in.)* Paid in gold, price escalating per respec, competing with refinement for the same pool.
→ *Constraint:* respec is one of the clearest **gold sinks** the game has — a recurring,
player-initiated cost on a decision players want to make repeatedly. When gold arrives, pricing
the existing free respec is a balance change, not a feature.

**The login summary screen.** *(in the alpha — offline honours Stop/Retry, so a session can cost
several levels and several gear pieces overnight, and the player has to be told. See
[`alpha.md`](alpha.md) § Death.)* Time away, runs completed, runs timed out, deaths, XP, gold, gear
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

**Classes.** *(one class, one branch — Beastmaster/Shapeshifter — is in the alpha.)* Every class has 3 specialization branches, mixable for hybrids or maxable for a pure
build. The v1 class was going to be a Druid (WYD-inspired) with **Beast Master** (summons packs,
tanks via shapeshifting), **Shapeshifter** and **Elementalist**. Only Beast Master was ever more
than a name. Whether every class can fill a tank role was explicitly undecided.

``` md
                  +----------------------------+
                  |  Player Uses Transform Skill|
                  +--------------+-------------+
                                 |
                                 v
                  +----------------------------+
                  |    Read Skill Level (X)    |
                  +--------------+-------------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
   [ Level 1-5 ]           [ Level 6-9 ]           [ Level 10+ ]
         |                       |                       |
         v                       v                       v
+------------------+    +------------------+    +------------------+
| 1. Swap Outfit to|    | 1. Swap Outfit to|    | 1. Swap Outfit to|
|    "Beast_Form"  |    |    "Beast_Form"  |    |    "Beast_Form"  |
| 2. Set Shader:   |    | 2. Set Shader:   |    | 2. Set Shader:   |
|    GLOW_OFF      |    |    SILVER_GLOW   |    |    GOLD_FLASHING |
| 3. Apply Base    |    | 3. Apply Mid     |    | 3. Apply Max     |
|    Stat Buffs    |    |    Stat Buffs    |    |    Stat Buffs    |
+------------------+    +------------------+    +------------------+
         |                       |                       |
         +-----------------------+-----------------------+
                                 |
                                 v
                  +----------------------------+
                  |   Transformation Timer     |
                  |         Expires?           |
                  +--------------+-------------+
                                 |
                                 v
                  +----------------------------+
                  | 1. Revert to Human Outfit  |
                  | 2. Remove All Shaders      |
                  | 3. Strip Stat Buffs        |
                  +----------------------------+
``` 

**Per-item attribute spreads,** so two items of the same tier are a genuine choice rather than a
bigger/smaller comparison. More slots: helmet, boots, gloves, then accessories once there are
stats worth putting on them.

**Deferred stats** the schema should tolerate: Speed (attack-speed multiplier), Accuracy vs.
Evasion, crit chance, elemental damage and resistances, class-specific vs. universal items, gear
durability and repair as a second gold sink.

**A visual layer.** Sprites, 4-frame animations, floating damage numbers, screen shake, easing on
every bar, a sound per meaningful event. Rare drops get disproportionate fanfare. The plan was a
React/DOM layer for everything configurable plus a small canvas viewport that only renders the
fight from the server's event stream — which is why combat emits events from day one.

---

## Explicitly not wanted, so far

*(Amended 2026-08-22. **Parties are in** — an arena holds several players and scales monsters by
headcount from day one, though the invite and join UI ships after the alpha. The rest of this list
stands.)*

PvP, chat, guilds, trading, friends — anything else social. Crafting. Prestige / reset-for-multiplier
loops. Achievements, daily quests, events.

These were framed as scope cuts rather than permanent rulings, but none of them has ever had a
reason to exist beyond "other idle games have it." That's not a reason.

---

## Deferred by the alpha scope audit

Added 2026-08-24 by [`docs/prompts/05-audit-alpha-scope-and-seed-the-feature-list.md`](docs/prompts/05-audit-alpha-scope-and-seed-the-feature-list.md).
Each carries the constraint that keeps it cheap to add later.

**A monetization surface.** Nothing is being built for this and nothing is committed to. It is
recorded because two alpha decisions happen to leave the door open, and it costs nothing to
notice: a **backpack expansion** and an **automatic item sale** are the natural relief for the
inventory cap, and a **priced respec** is the natural gold sink (above).
→ *Constraint:* the backpack capacity is a number on the character, never a constant in code,
and forfeiting a drop when full runs through exactly one code path.

**Animated sprites.** The alpha ships static ones. Walk cycles and attack frames are pure art.
→ *Constraint:* the renderer drives the frame index from the render loop rather than from CSS
(`stack-web.md` 12), and the packed-atlas pipeline is in place from the first sprite
(`stack-web.md` 34 and 35), so animation is an atlas swap.

**Commissioned character art.** The alpha uses a CC0 pack.
→ *Constraint:* content references a sprite by filename through one manifest
(`stack-web.md` 33), so replacing the art is a manifest edit.

**Onboarding.** Seven skills and two rule lists arrive at once with nothing explaining them. See
*Onboarding* above; the alpha has no tutorial at all.
→ *Constraint:* skill points both unlock and raise, so a guided first spend is a UI overlay
rather than a second progression system.

**A rolling daily-Hard recharge.** The alpha refills the count at a fixed UTC hour and accepts
that a player awake at the boundary can double one night's high-tier income.
→ *Constraint:* spending a Hard run writes a timestamp, so switching to a rolling 24-hour
recharge is a query change rather than a schema change.

**Splitting the potion cooldown by family.** The alpha shares one cooldown across health and
mana potions, which is the harshest option and can produce death spirals.
→ *Constraint:* the cooldown is a content value, not a code branch.

**Offline Hard tier.** Offline runs Easy and Medium only, so a player who only plays offline
never fights a boss.
→ *Constraint:* the daily Hard count and offline sealing never touch each other today; keep it
that way until a deliberate decision joins them.

---

## Deferred by the live-hunt design

Added 2026-08-22 by [`docs/explorations/04-the-live-hunt.md`](docs/explorations/04-the-live-hunt.md).
Each carries the constraint that keeps it cheap to add later.

**Paid potions and the supply economy.** The Tibia loop — potions cost gold, profit is loot minus
supplies, and "waste" is the number players optimise against. The alpha gives potions away free.
→ *Constraint:* potions are **items** from day one, never skills. A skill has no quantity, no price
and no inventory slot, and retrofitting all three is the migration this avoids.

**Items and buffs that prevent gear loss on death.** A second gold sink, and the thing that makes
Hard tier survivable to gamble on.
→ *Constraint:* gear loss on death runs through exactly **one** code path that an item can veto.
Scattered across three call sites, the item becomes a bug hunt instead of a feature.

**A city, world bosses, and arenas bigger than one party.** Players seeing each other outside a
fight; shared open-world encounters.
→ *Constraint:* nothing may hard-code "one arena per party". The arena holds a list of players and
a membership rule; both are data.

**Party UI** — invites, a party screen, joining and rejoining a friend's arena mid-hunt.
→ *Constraint:* the arena holds a list of players, splits XP by headcount and scales monsters by
headcount from the first line of code — with a headcount that happens to be 1 during the alpha.

**De-levelling.** See *Death and de-leveling* above for its constraint.

---

## Seasons

Added 2026-08-28, when the game was named **Tormented Path** and its current content
era was named the **Mortal Ways** season (alpha → V1).

**A second season — *Celestial Ways*.** Wanted for a far-future major version. Undecided
and not designed here: whether a new season is content-only — new hunts, forms and items
on the same characters — or a fresh start, with a ladder and economy reset and old
characters archived to a permanent pool.
→ *Constraint:* the game name and the active season are one `brand` module the web app
imports (`docs/naming.md` rule 16), never a literal typed twice, and the season is a bare
label with no mechanic wired to it. So swapping the label to *Celestial Ways* is one edit,
and giving a season teeth later is additive rather than a rewrite.

---

## Ideas that arrive at the wrong time

Write them here. Don't build them.

| Idea | Date |
| --- | --- |
| Set items unlock outfits | 12/08/2026 |
| Shapeshift is an outfit unlocked by skill usage | 12/08/2026 |
| Wing forging bench unlocks outfit addons | 12/08/2026 |
| Support spell - chaining heal (heal all pt but reduces effectiveness on each bump) | 18/08/2026 |
| Support spell - bend tempo ("paralyze" like effect on mobs, reduce attak speed and mob speed) | 18/08/2026 |
| Class - Dryad - Foema like class (can be archer, white or dark magic) | 18/08/2026 |


# Closed Alpha Vision:

> **Superseded.** These are the original raw notes the closed alpha was written
> from, kept for provenance. [`alpha.md`](alpha.md) is the spec; where the two
> disagree, `alpha.md` wins. Notably this section still says a hunt loop has a
> capped experience pool, which stopped being true on 2026-08-23.

## The Game
- Idle browser game inspired by Tibia, MuOnline, Path of Exile 2, WYD.
- Graphics will be Tibia like.
      - 32 x 32 Isometric
      - A character or monster is always placed in 1 tile
            -  They can never occupy the the same tile at the same time

## Loop
1. Pick a "Hunt"
2. Clear monster waves
3. Fight a boss
4. Collect items
5. Hunt again

## Progression
- Experience Points
      - Players gain experience points from going through hunt loops
            - A hunt loop has a pre-defined cap of experience available
- Level
      - A player gains levels by accumulating experience points
      - Level for alpha will be limited to 30

- Skill Points
      - One skill point is rewarded on every level gained by the player
      - A skill point is used to increase class skills

## Monsters
- A single monster with 5 variants
      - 1. Physical Damage
      - 2. Physical Damage + Fire Damage
      - 3. Physical Damage + Electric Damage

## Bosses
- A single boss with 5 variants
      - 1. Physical Damage
      - 2. Physical Damage + Fire Damage
      - 3. Physical Damage + Electric Damage

## Hunts
1. Monsters: [1], Boss: [1]
2. Monsters: [2], Boss: [2]
3. Monsters: [3], Boss: [3]

## Attributes:
### Resource
- Health Points 
- Mana Points
- Health Regeneration
- Mana Regeneration

### Defences
- Physical Defence
- Elemental Defence
      - Fire Resistance
      - Electric Resistance

### Damage
- Physical Damage
- Elemental Damage
      - Fire Damage
      - Electric Damage
- Critical
      - Critical Chance (Applies for Physical and Elemental)
            - Unit: Percentage
      - Critical Damage (Applies for Physical and Elemental)
            - Unit: Float
      - Multiplier: 1.5 (configurable)
      - Math: {elemental-damage || physical damage} * {crit-multiplier}
            - TBD: How Critical Damage works? Additive damage? Multiplcative Damage?
- Attack/Cast Speed

## Skills:
### What is?
- Active
      - Configured to be casted under specified conditions by the player
            - E.g. Self Health Points <= 60 ? Shapeshift into Werebear
            - E.g. Self Health Points > 60 ? Shapeshift into Werewolf
      - Have cooldown 
- Passive
      - Persistent buff/debuff applied to the character or to others around
- Buff
      - Is a positive modifier applied to a character or monster
            - E.g. A passive skill increases Health Points regeneration
            - E.g. An active skill increases target critical strike chance for X amount of time
- Debuff
      - Is a negative modifier appled to a character or monster
            - E.g. A passive skill constatly reduces nerby monsters attack speed
            - E.g. An active skill breaks target armor for X amount of seconds
- Level
      - A skill can be improved up to 10 times
      - On every upgrade the skill performance improves
## Classes
### Beastmaster
- Specialization: Shapeshifter
- Forms:
      - Werewolf
      - Werebear

#### Skills
- Shapeshifting skills have 5 seconds cooldowns between transformations. Meaning that if one enters Werebear form, it takes at least X seconds to shift into any other.

1. Active - Werewolf Form: When casted player transforms into a Werewolf
      1.1. Every level increased increases player physical damage by X%
      1.2. Every level increased increases player life leech by X%
      1.3. On transformation player looses X% of health points
            1.3.1. Every level reduces health points loss % (e.g. Base X% - additional Y% based on skill level)
      1.4. On transformation player gains X% of attack speed
            1.4.1. Every level increases the extra attack speed % (e.g. Base X% + additional Y% based on skill level)
2. Werebear Form: When casted player transforms into a Werebear
      2.1. Every level increased increases player elemental resistances by X%
      2.2. Every level increased increases health regeneration by X health points per second
      2.3. On transformation player looses X% of attack speed
            2.5.1. Every level reduces attack speed loss % (e.g. Base X% - additional Y% based on skill level)
      2.5. On transformation player gains X% of extra health points
            2.5.1. Every level increases the extra health points % (e.g. Base X% + additional Y% based on skill level)
3. Human Form: When casted player transform into human
4. Active - Claw Strike: Attack 3 monsters that are currently in front of the player
5. Passive - Effective Killer: Increases critical strike chance by X amount per second up to Y amount while the player is shapeshifted into werewolf.
      5.1. Buff is lost if player is back into human or werebear form.
6. Passive - Bear Presence: Deal fire damage to all enemies on X tile radius by X amount per second up to Y amount while the player is shapeshifted into Werebear.
      6.1. Buff is lost if player is back into human form or if entered Werewolf form
6. Passive - Human in the Loop: Accumulates damage taken and dealt up to X amount.
      6.1. When in human form a barrier activates absorbing Y amount of damage
      6.2. Any damage that exceeds the barrier is reduced by 50%.
      6.3. Every level reduces the shifting cooldown by 0.25 seconds

## Items
### Tiers:
1. Common: 
      - Has item base defence
2. Uncommon:
      - Has item base defence
      - Has one prefix and one suffix

### Attributes:
#### Prefixes:
1. Critical Chance
2. Critical Damage
3. Attack/Cast Speed
4. Extra Healing Power
5. Life Leech
6. Mana Leech

#### Suffixes:
1. Elemental Resistance
      1.1. All Resistances
      1.2. Fire
      1.3. Electric
2. Extra Health Percentage
3. Extra Mana Percentage
4. Extra Drop Rate
5. Extra Exp Rate

### Helmet
- Base Attribute: Physical Defence
- Uncommon:
      - Prefix: [1,2,3,4,5,6]
      - Suffix: [1,2,3,4,5]

### Armor
- Base Attribute: Physical Defence
- Uncommon:
      - Prefix: [1,2,3,4,5,6]
      - Suffix: [1,2,3,4,5]

### Legs
- Base Attribute: Physical Defence
- Uncommon:
      - Prefix: [1,2,3,4,5,6]
      - Suffix: [1,2,3,4,5]

### Gloves
- Base Attribute: Physical Defence
- Uncommon:
      - Prefix: [1,2,3,4,5,6]
      - Suffix: [1,2,3,4,5]

### Boots
- Base Attribute: Physical Defence
- Uncommon:
      - Prefix: [1,2,3,4,5,6]
      - Suffix: [1,2,3,4,5]

### Weapon:
- Claw
- Uncommon:
      - Prefix: [1,2,3,4,5,6]
      - Suffix: [1,2,3,4,5]
