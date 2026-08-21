# Closed Alpha — the spec

The game as it is actually intended, and the decisions the build rests on.

This supersedes the old `design.md` (a different, much smaller game: three zones, two
upgrade buttons, no gear, no boss, no levels) and the old `roadmap.md` (a build order for
that game). Both were deleted on 2026-08-20; their full text is in git history at commit
`8144bf3` if the reasoning is ever needed.

Anything wanted but not in the alpha lives in [`vision.md`](vision.md).

---

## What it is

A browser idle RPG in the Tibia visual idiom. You pick a hunt, your character clears waves
and a boss on its own, you come back to loot.

The play is **not** in watching the fight. It is in authoring how your character fights —
an ordered rule list — and in the gear and skill points that make those rules pay off.

**Goal:** ship a game people play. **Audience, staged:** friends in a closed alpha →
MuOnline/Tibia/WYD nostalgics → general idle players.

## The loop

```
pick a hunt → clear monster waves → fight the boss → collect items → hunt again
```

---

## Foundational decisions

These four are architecturally defining. Changing any of them later is a rewrite, not an
edit. Decided 2026-08-20.

The rules they imply are written down where the work happens, not here:
[`docs/architecture-api.md`](docs/architecture-api.md) (the simulation and determinism),
[`docs/architecture-web.md`](docs/architecture-web.md) (the renderer boundary),
[`docs/design.md`](docs/design.md) (balance and content) and
[`docs/process.md`](docs/process.md) (build order and playtesting).

### 1. Arena, not map

A hunt is a small, wall-free room with a cap on how many monsters are alive at once.

- Entities have positions on a tile grid and never share a tile.
- Movement is "step one tile toward your target". **No pathfinding, no line of sight** —
  there is nothing to path around and nothing to see through.
- Skills carry a **targeting shape**: single target, radius ball, beam (`length` +
  `spread`), cone.
- Two monsters must never claim the same tile in one tick — tile reservation is resolved
  in a fixed, deterministic order.

*Why:* this is what lets Bear Presence's radius and Claw Strike's three targets be true
rules rather than flavour text, without paying for a navigation engine. It is the shape
Baiak Idle actually ships — see [`docs/explorations/01-how-baiak-idle-works.md`](docs/explorations/01-how-baiak-idle-works.md)
§1.5. What that game deleted was Tibia's *world* (open terrain, visibility, stacking,
containers), not its *arena*.

*Deferred, and cheap to add later:* per-monster movement behaviour, ranged monsters
keeping their distance, and autopilot quality as a stat (`aimChance` — one probability
deciding whether a tick runs the optimal branch or a worse one, bought half by level and
half by a talent).

### 2. Offline is replay

Offline progress is the live combat code, fast-forwarded. Not a formula, not an
approximation.

- One fixed tick rate. Catching up on ten hours away means running those ticks, fast.
- **Randomness is seeded** from day one — same seed, same rolls, same outcome. A replay is
  reproducible and refreshing cannot reroll it.
- The server owns the clock and the seed. Never `Date.now()` from the browser.

*Why:* one combat system instead of two. Every mechanic works offline the day it is built,
with no second set of "on average" formulas to keep in sync and no parity test to maintain.
The cost grows with players × time away, which is free at friends-scale; a cheaper path can
be added later and validated against this one.

*This is the decision the old `design.md` got wrong for this game* — waves, a boss, crits
and conditional autocast mean the rate is never constant, so `goldPerSec × elapsed` cannot
work here.

### 3. The player authors behaviour

The player never presses a button during a fight, so the fight is not where the decisions
are. The decisions are in the rule list.

- Skills go into an **ordered priority list**.
- Each row carries one condition from a **fixed vocabulary**: my HP below X%, enemy count
  above X, I am in form Y, buff Z active, and so on.
- Each tick, the first row whose condition is true and whose cooldown is ready fires.

*Why:* proven design (FF12 gambits, Baiak's rotation bar), cheap to build, cheap to
balance, and it makes `HP <= 60 → Werebear` work exactly as written. A full if/then/AND/OR
rule builder is more expressive and much harder to balance — not in the alpha.

### 4. Server-authoritative from day one

The server owns state, the clock and the seed. The client sends intent and renders.

*Why:* decision 2 forces it. Replay-based offline requires the server to own the clock and
the RNG seed, so a local-first alpha would be rewritten the moment it went online — and the
alpha is meant to be shared with people, which means it is online anyway.

---

## Graphics

- Tibia-like *idiom*, 32×32 isometric — the look, not the assets.
- One character or monster per tile; never two on the same tile at the same time.

**No Tibia resources are used.** Arenas use a downloaded open-source asset set. Character
and monster sprites are undecided.

> **Open — character art.** Not an alpha blocker (placeholders render fine against an
> event stream) but it has lead time, so decide the pipeline — commission, asset pack, or
> original — in parallel with building rather than before it.
>
> Record the arena set's licence and its attribution requirement in the repo now, while you
> still remember where it came from. Most open-source sprite licences (CC-BY, OGA-BY) want
> credit in a specific form, and reconstructing that a year later is miserable. See
> [`docs/explorations/01-how-baiak-idle-works.md`](docs/explorations/01-how-baiak-idle-works.md)
> §4 for why this matters more here than in most projects.

---

## Progression

**Experience.** Gained by running hunt loops. Each hunt loop has a pre-defined cap on the
experience available in it.

**Level.** Accumulated experience. Capped at **30** for the alpha.

**Skill points.** One per level gained, spent raising class skills.

---

## Attributes

**Resource**
- Health Points
- Mana Points
- Health Regeneration
- Mana Regeneration

**Defences**
- Physical Defence
- Elemental Defence — Fire Resistance, Electric Resistance

**Damage**
- Physical Damage
- Elemental Damage — Fire, Electric
- Critical
  - Critical Chance — percentage, applies to physical and elemental
  - Critical Damage — float, applies to physical and elemental
  - Base multiplier: 1.5, configurable
- Attack / Cast Speed

### How modifiers combine

**Additive within a stat, multiplicative between stats.**

- Every source of the *same* stat sums. Two items granting +30% and +20% crit damage give
  `1.5 + 0.30 + 0.20 = 2.0×`.
- Stats then multiply into the damage result: `damage × critMultiplier`.

*Why:* summing within a stat keeps gear comparable to gear and stays balanceable inside a
level-30 ceiling; multiplying between stats is what makes a build feel like a build, and it
is what the nostalgia audience already expects from ARPGs.

**Schema rule, and it matters more than the formula:** a character carries a **list of
modifier sources**, never one pre-summed number. Where each modifier came from (item,
skill, buff, form) stays attached to it. That is what makes buffs expire correctly, makes
the character sheet explainable, and makes the combining rule a single function that can be
changed in an afternoon instead of a migration.

---

## Skills

**Active** — cast automatically when the player's rule conditions are met. Have cooldowns.

**Passive** — a persistent buff or debuff on the character or on things around it.

**Buff** — a positive modifier on a character or monster.
*e.g. a passive raising health regeneration; an active raising a target's crit chance for X seconds.*

**Debuff** — a negative modifier on a character or monster.
*e.g. a passive constantly lowering nearby monsters' attack speed; an active breaking armour for X seconds.*

**Level** — a skill can be improved up to 10 times. Every upgrade improves its performance.

---

## Classes

### Beastmaster — specialization: Shapeshifter

Forms: Human, Werewolf, Werebear.

Shapeshifting has a **5 second cooldown between transformations** — entering Werebear form
means at least that long before shifting into anything else.

| # | Kind | Skill | Effect |
| --- | --- | --- | --- |
| 1 | Active | **Werewolf Form** | Transform into a Werewolf. Each level: +X% physical damage, +X% life leech. On transformation: lose X% health (each level reduces the loss) and gain X% attack speed (each level increases the gain). |
| 2 | Active | **Werebear Form** | Transform into a Werebear. Each level: +X% elemental resistances, +X health regeneration per second. On transformation: lose X% attack speed (each level reduces the loss) and gain X% extra health (each level increases the gain). |
| 3 | Active | **Human Form** | Transform back into human. |
| 4 | Active | **Claw Strike** | Attack 3 monsters currently in front of the player. |
| 5 | Passive | **Effective Killer** | While in Werewolf form, gain X crit chance per second up to Y. Lost on returning to human or Werebear form. |
| 6 | Passive | **Bear Presence** | While in Werebear form, deal X fire damage per second to all enemies within X tiles, up to Y. Lost on returning to human or entering Werewolf form. |
| 7 | Passive | **Human in the Loop** | Accumulates damage taken and dealt up to X. In human form a barrier activates absorbing Y damage; damage exceeding the barrier is reduced by 50%. Every level reduces shifting cooldown by 0.25s. |

---

## Monsters and bosses

One monster with three variants, one boss with three variants:

1. Physical Damage
2. Physical Damage + Fire Damage
3. Physical Damage + Electric Damage

Three is enough to prove the resistance stats matter. Adding a fourth is a content edit —
a stat block and an ability list — not a code change.

## Hunts

| Hunt | Monsters | Boss |
| --- | --- | --- |
| 1 | Variant 1 | Variant 1 |
| 2 | Variant 2 | Variant 2 |
| 3 | Variant 3 | Variant 3 |

---

## Items

### Tiers

1. **Common** — base defence only.
2. **Uncommon** — base defence, plus one prefix and one suffix.

### Prefixes

1. Critical Chance
2. Critical Damage
3. Attack / Cast Speed
4. Extra Healing Power
5. Life Leech
6. Mana Leech

### Suffixes

1. Elemental Resistance — All / Fire / Electric
2. Extra Health Percentage
3. Extra Mana Percentage
4. Extra Drop Rate
5. Extra Experience Rate

### Slots

| Slot | Base attribute | Uncommon prefixes | Uncommon suffixes |
| --- | --- | --- | --- |
| Helmet | Physical Defence | 1-6 | 1-5 |
| Armor | Physical Defence | 1-6 | 1-5 |
| Legs | Physical Defence | 1-6 | 1-5 |
| Gloves | Physical Defence | 1-6 | 1-5 |
| Boots | Physical Defence | 1-6 | 1-5 |
| Weapon (Claw) | — | 1-6 | 1-5 |

---

## Still open

- **Sequencing.** Arena combat, levelled skills, the rule engine, prefix/suffix loot, an
  isometric renderer, XP and 30 levels, server and auth. Naming this one alpha is fine;
  slicing it into a build order is a real exercise and has not been done.
- **Character and monster art** (see Graphics above) — arenas are settled with an
  open-source set; characters are not. Changes zero lines of code, but has lead time.
- **The XP curve to level 30**, and whether three hunts are enough to carry it.
- **Death.** Nothing here says what happens when the character loses. `vision.md` wants it
  harsh and MuOnline-flavoured; the alpha has not decided whether it exists at all.
