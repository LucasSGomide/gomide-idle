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
and a boss on its own, and you keep it alive by rewriting how it fights.

The play is **not** in controlling the fight — you never issue a combat command. It is in
authoring how your character fights: two ordered rule lists, the gear and skill points that
make those rules pay off, and the tuning you do **while watching it happen**.

**Goal:** ship a game people play. **Audience, staged:** friends in a closed alpha →
MuOnline/Tibia/WYD nostalgics → general idle players.

## The loop

```
pick a hunt, a tier and a density → enter an arena → clear escalating waves
  → (Hard tier) fight the boss → collect items → keep going or leave
```

Easy and Medium loop forever and have no boss. Hard ends at a boss and is limited
to a number of runs per day. See **Hunts** below.

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
- **Offline hunting is a mode you enter on purpose.** You go to the offline screen, pick a
  hunt, and log out. That *seals* the session: gear, skill levels and rule list are frozen
  at that moment and cannot change until you come back.
- A sealed session is replayed **exactly once**, at your next login, and then it is over.
  That is what keeps catch-up cheap — there is no fight that gets longer every time you
  log in.
- Closing the tab while watching a live hunt is not offline hunting. Your character
  stays in the arena for five seconds — long enough that it can still die — then
  exits and banks. Crashing and quitting are the same event.
- **Sealing applies to offline only.** A live hunt takes gear, gambit, skill-point
  and targeting changes continuously, and is never replayed. See
  [`docs/explorations/04-the-live-hunt.md`](docs/explorations/04-the-live-hunt.md).
- **Nothing about a fight is ever written to the database.** What is stored is the
  session's inputs (hunt, seed, content version, start time, the frozen character) and the
  XP and loot it banks. Positions, HP, cooldowns and buffs are rebuilt by replay and thrown
  away — see [`docs/explorations/02-domain-model.md`](docs/explorations/02-domain-model.md).

*Why:* one combat system instead of two. Every mechanic works offline the day it is built,
with no second set of "on average" formulas to keep in sync and no parity test to maintain.
The cost grows with players × time away, which is free at friends-scale; a cheaper path can
be added later and validated against this one.

*This is the decision the old `design.md` got wrong for this game* — waves, a boss, crits
and conditional autocast mean the rate is never constant, so `goldPerSec × elapsed` cannot
work here.

### 3. The player authors behaviour

The player never issues a combat command — the character fights itself. The decisions are
in the rule lists, and the player edits them **while watching the fight**, which is what
makes the arena a feedback loop rather than a sealed consequence of one.

- Skills go into an **ordered priority list**.
- Monster targeting is a **second ordered list**, authored the same way — "kill the fire
  variant first", "lowest health first".
- **Everything is editable mid-fight and takes effect on the next tick:** gear, both rule
  lists, and skill points. No cost, no cooldown, no window to wait for.
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

## Death

Death exists, and it is not free.

- **You lose experience** — but never a level. Loss stops at the floor of your current
  level; de-levelling is `vision.md` territory.
- **You lose one random gear piece**, destroyed. Nothing lands on the ground, so nobody
  picks it up. Items that prevent this are a post-alpha gold sink.
- **You choose Stop or Retry** per account. Stop leaves the arena; Retry respawns you and
  keeps going.
- **Offline honours the same setting.** On Retry a sealed session can cost you several
  levels and several gear pieces overnight, by choice — so sealing must state the risk every
  time, and the login summary must show losses first and loudest.

---

## Progression

**Experience.** Gained by killing monsters in an arena, and **banked per kill** — there is
no unbanked progress, so leaving, crashing and dying never take XP already earned. Hunts
have no experience cap; Easy and Medium never end.

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

### Tiers

Each hunt runs at three tiers. **Tier sets monster strength and how deep the wave program
goes** — nothing else.

| Tier | Waves | Boss | Purpose |
| --- | --- | --- | --- |
| Easy | loops forever | no | experience and low-tier items |
| Medium | loops forever | no | experience and low-tier items |
| Hard | ends at a final wave | yes | high-tier items, capped per day |

**Hard is limited to N runs per day.** While the count lasts a player or party may loop it;
when it is spent they are returned to the menu. This is the primary brake on high-tier
items entering the world — which is why boss loot is *not* divided between party members.

### Density

Independently of tier, the player picks **High** or **Low Density**.

- **High Density** — more monsters alive at once, individually weaker. Rewards area damage:
  Werebear and Bear Presence.
- **Low Density** — fewer monsters, each with more health and more damage. Rewards
  single-target damage: Werewolf.

Both must produce **equal experience per hour**, and therefore equal clear time — boss loot
scales with clear speed, so a slower mode would otherwise be punished twice.

### Scaling

Tier, density and party size are **multipliers over one hunt definition**, never eighteen
hand-authored tables.

- Monster count and the alive-cap **scale with the number of players** in the arena, so a
  party is economically identical to the same people hunting alone.
- Experience **splits evenly** across the party, which with scaled monsters is exactly
  neutral.
- Every player spends their own daily Hard run and **rolls their own loot, undivided**.

### The arena

An arena is created when the first player enters and destroyed when the last one leaves.
Wave progress lives in memory and dies with it, so every session starts at wave 1. Alpha
arenas are **private to one party** — no city, no strangers, no shared world. Outside a
hunt the player sees configuration UI and inventory, nothing else.

**Leaving takes five seconds**, during which the character is still in the fight and can
still die. A dropped connection is a leave.

---

## Items

### Potions

Potions are **items, not skills** — free in the alpha, so paid potions can arrive later
without a model change. Tiers unlock by level: inferior from the start, common at 10,
superior at 30. Gambits drink them like any other conditional action.

> **Open.** A free unlimited heal has no bottleneck, which
> [`docs/design.md`](docs/design.md) rule 9 forbids. Potions need a cooldown.

### Loot

Loot never lands on the ground. A kill resolves straight into your inventory — no item to
walk over, no pickup, no despawn timer.

### Rarity

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
- **Daily Hard runs.** Whose counter is spent when a party runs Hard together, and when the
  count resets.
- **The potion cooldown** (see Items above).
- **The numbers.** Wave depth per tier, alive-cap escalation per wave, the boss loot curve
  against clear time, and the tier and density multipliers.
