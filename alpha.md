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

The architecture principles they imply are written down where the work
happens, not here: [`docs/architecture-api.md`](docs/architecture-api.md) (the
simulation and determinism) and [`docs/architecture-web.md`](docs/architecture-web.md)
(the renderer boundary). Everything else those principles imply — functional
requirements, the player and operator needs behind them, and tuning notes —
is staged in this doc's own Functional Requirements, User Needs and Notes
tables below, until [`docs/requirements.md`](docs/requirements.md) formalizes
it. [`docs/design.md`](docs/design.md) is UI/UX guidelines and has no content
yet.

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
- **Offline runs Easy or Medium only — never Hard.** Hard terminates at its boss, so a
  sealed Hard session would end minutes into a ten-hour absence; making it loop instead
  would spend every daily Hard run while you slept, which is the opposite of rationing the
  thing the daily cap exists to ration. Hard is what you show up for.
- **Offline earns reduced experience and reduced drops.** A player who is present is
  rewarded more than one who is not. The reduction is the one stated exception to the
  one-player-hour invariant below, and it is deliberate rather than emergent.
- **One sealed session per account**, not one per character — see **Account and characters**.
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
  lists, and newly earned skill points. No cost, no cooldown, no window to wait for.
- **Reallocating already-spent skill points is not a mid-fight action** — see
  **Progression**. Spending a point you just earned is; pulling points back out is not.
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

- Tibia-like *idiom* — the look, not the assets.
- **Orthogonal top-down, 32×32 tiles.** A square grid viewed straight on, which is what
  Tibia actually is. Not isometric: the diamond projection is the MuOnline/Diablo look, a
  standard isometric tile is 64×32 rather than 32×32, and free 32×32 art is overwhelmingly
  top-down. Decided 2026-08-24; [`docs/stack-web.md`](docs/stack-web.md) rule 10 carries the
  corrected projection.
- One character or monster per tile; never two on the same tile at the same time.

**No Tibia resources are used.** Arenas and characters use a downloaded **CC0** asset set.
CC0 is the specific requirement, not open-source generally: CC-BY and OGA-BY oblige credit
in the medium rather than in the repository, and CC-BY-SA is viral. Record the set under
REUSE anyway so its provenance survives — see
[`docs/stack-web.md`](docs/stack-web.md) rules 36 and 37, and
[`docs/explorations/01-how-baiak-idle-works.md`](docs/explorations/01-how-baiak-idle-works.md)
§4 for why this matters more here than in most projects.

**Real sprites ship with the renderer, not after it.** Human, Werewolf and Werebear, plus
the three monster variants and the boss, are needed from the first frame — a form change
has to be *visible*, or the whole shapeshifting build is an invisible stat swap. The hard
part of the search is the combination, not the size: one coherent pack holding a humanoid,
a wolf, a bear and three recolourable monsters.

**Animation frames are deferred.** Static sprites are acceptable for the alpha. The
renderer drives the frame index from the render loop
([`docs/stack-web.md`](docs/stack-web.md) rule 12), so an animated sheet drops in later
without touching anything else.

---

## The live hunt view

Decision 3 makes the fight a feedback loop: the player watches, then retunes. That only works
if the fight is *readable*. Nothing in this spec said what the player can see, so this section
says it. Decided 2026-08-24.

**In the arena.** Health bars over every entity and floating damage numbers, distinguishing
physical from fire from electric — the resistance suffixes are unreadable otherwise.

**A status panel.** Your health and mana, current form, active buffs and debuffs with time
remaining, the wave number, and experience per hour as a **rolling five-minute average**. A
whole-run average takes twenty minutes to reflect a change made thirty seconds ago, which
defeats the point of tuning while watching.

**A gambit trace, and this is the part that matters.** The live rule list highlights the row
that fired this tick, and greys every skipped row with the reason it was skipped: *on
cooldown*, *not enough mana*, *condition false*.

*Why it earns its place.* Suppose row 1 is `HP <= 60% → Werebear`, row 2 is
`always → Claw Strike`, and the character dies at 20% health, still human. Bars and damage
numbers alone cannot separate: Werebear was on its shapeshift cooldown every tick the
condition held; there was no mana for it; the rows are in the wrong order; health never
crossed 60% until the killing blow; the real problem was elemental damage rather than the
form; or Werebear *is* firing and simply is not enough. The trace separates all six. Without
it the player retunes by guessing, and the authoring loop has no instrument.

*Why it is cheap.* The server already emits a cast event per tick. Adding the row id and a
skip reason to that event is close to free, and the highlight is ordinary React living outside
the renderer's element — exactly where
[`docs/architecture-web.md`](docs/architecture-web.md) puts the gambit editor already.

**On death,** the player is told what killed them: which monster, which damage type, how much.

---

## Account and characters

Decided 2026-08-24; `alpha.md` had never said anything about accounts at all.

- **Ordinary e-mail sign-up, server-side sessions.** No invite codes and no allowlist —
  closed-alpha access is an unlisted URL among friends. See
  [`docs/stack-api.md`](docs/stack-api.md) rules 26–28.
- **An account holds several characters.** There is one class and one specialization, so a
  second character is not a different fantasy — it is a second *build*, which is what makes
  it worth having: a level-20 wolf spec and a level-20 bear spec, side by side, is the
  cheapest balance instrument in the game.
- **A character-select screen therefore ships in the alpha**, and it shows which character
  is currently sealed offline.
- **Exactly one sealed offline session per account, not per character.** Per-character
  sealing would make one eight-hour absence pay out several characters' worth of progress,
  and the cheapest way to play would become rolling alts you never play. It also keeps
  login to one bounded replay rather than several serialized ones.

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
have no experience cap; Easy and Medium never end. Offline earns at a reduced rate.

**Level.** Accumulated experience. Capped at **30** for the alpha.

**What a level gives you.** One skill point, plus a rise in **base health and base mana**.
It gives **no free damage** — damage comes only from gear and from spent skill points, so
every point of offensive power a character has was either equipped or chosen. The health
and mana floor exists so a player who gears badly is still not helpless.

**Skill points.** One per level, **starting at level 1** — so a character has as many points
as their level, and 30 at the ceiling. (This overturns
[`docs/explorations/02-domain-model.md`](docs/explorations/02-domain-model.md)'s invariant
`skill points ≤ level − 1`.)

**Skill points both unlock and raise.** A new character knows **Human Form only** — it is
free, always available, and can never be lost, because a character with no way back to human
would be stuck in a form forever. Everything else costs a point to learn at skill level 1 and
further points to raise, to a maximum of 10. Thirty points across seven skills that each want
ten is the build decision.

**Respec is free, but only outside an arena.** Pulling points back and reassigning them
happens on the configuration screen, never mid-fight. Gear can be swapped mid-fight because
you own a finite set of items and every slot swap gives something up; a skill-point pool has
no opportunity cost at all, so mid-fight reallocation would mean re-optimising the whole tree
every wave — micromanagement, and precisely the hands-on play the rule list exists to
replace. Free rather than priced because the alpha has no gold to price it in; `vision.md`
keeps paid respec as a gold sink for when gold arrives.

---

## Attributes

**Resource**
- Health Points
- Mana Points
- Health Regeneration
- Mana Regeneration

**Mana is spent by active skills and by nothing else.** Passive skills are free. This is
what makes Mana Leech, Extra Mana Percentage and mana potions real rather than decorative,
and it means an empty pool can deny a shapeshift — so `HP <= 60% → Werebear` can fail for a
reason the player has to author around. The rule-list condition vocabulary therefore exposes
mana alongside health.

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

**Active** — cast automatically when the player's rule conditions are met. Have cooldowns
**and a mana cost**.

**Passive** — a persistent buff or debuff on the character or on things around it. **Costs no
mana**; it is paid for with the skill point that bought it.

**Buff** — a positive modifier on a character or monster.
*e.g. a passive raising health regeneration; an active raising a target's crit chance for X seconds.*

**Debuff** — a negative modifier on a character or monster.
*e.g. a passive constantly lowering nearby monsters' attack speed; an active breaking armour for X seconds.*

**Level** — a skill is learned at level 1 with a skill point and improved up to 10 times,
one point per level. Every upgrade improves its performance. Human Form is the exception: it
is known from the start and costs nothing.

---

## Classes

### Beastmaster — specialization: Shapeshifter

Forms: Human, Werewolf, Werebear.

Shapeshifting has a **5 second cooldown between transformations** — entering Werebear form
means at least that long before shifting into anything else.

Every **Active** skill in the table below costs mana. The **Passives** cost none.

| # | Kind | Skill | Effect |
| --- | --- | --- | --- |
| 1 | Active | **Werewolf Form** | Transform into a Werewolf. Each level: +X% physical damage, +X% life leech. On transformation: lose X% health (each level reduces the loss) and gain X% attack speed (each level increases the gain). |
| 2 | Active | **Werebear Form** | Transform into a Werebear. Each level: +X% elemental resistances, +X health regeneration per second. On transformation: lose X% attack speed (each level reduces the loss) and gain X% extra health (each level increases the gain). |
| 3 | Active | **Human Form** | Transform back into human. **Known from the start, free, and not levellable** — a character must always have a way out of a form. |
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

### What gates a hunt

**Nothing.** All three hunts and all three tiers are open from level 1. Entering something
you cannot clear — including spending a daily Hard run on a boss that kills you — is the
player's own call.

Each hunt does display a **recommended level**, which is advice rendered on the selection
screen, not a wall. The intended shape:

| Hunt | Recommended | Why |
| --- | --- | --- |
| 1 — physical | 1 → ~12-15 | the starter; no elemental damage to resist yet |
| 2 — physical + fire | ~12-15 → 30 | wants Fire Resistance on your suffixes |
| 3 — physical + electric | ~12-15 → 30 | wants Electric Resistance on your suffixes |

So the three hunts are **not** a pure ladder and **not** a pure matchup. Hunt 1 is the
starter rung; hunts 2 and 3 are a parallel pair chosen by which resistance your gear favours.
The climb *within* a hunt is the tier — a harder tier pays better experience per hour, and
that is what makes moving up worth doing.

This is a real constraint on the still-open experience curve: it has to spread roughly
thirteen levels across hunt 1 and roughly seventeen across hunts 2 and 3.

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

**The count refills in full at a fixed hour, UTC.** One counter and one date per character,
and everyone resets together — which is what a coordinated group wants once party UI exists.
The accepted cost: a player awake at the boundary can spend N runs just before it and N just
after, doubling that night's high-tier income. A rolling 24-hour recharge per run would close
that; it was weighed and the simpler counter was chosen, so this is a known leak rather than
an oversight. Every player spends **their own** count
([`docs/explorations/04-the-live-hunt.md`](docs/explorations/04-the-live-hunt.md) #22), and
a sealed offline session never touches it because offline cannot run Hard.

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

Potions are **items, not skills** — free and unlimited in the alpha, so paid potions can
arrive later without a model change. Two families, **health and mana**, since active skills
cost mana. Tiers unlock by level: inferior from the start, common at 10, superior at 30.
Gambits drink them like any other conditional action.

**One cooldown, shared across every potion of both families.** Drinking an inferior health
potion locks out a superior one *and* a mana potion until it clears. This is the stated
bottleneck the Functional Requirements table demands, and it is deliberately the harshest of
the options considered: a bad moment costs you both survival and your ability to shift form,
so the threshold you write on a `HP <= X% → drink` row is a real decision rather than a
formality. It is one number to tune. Watch for death spirals a rule list cannot author its
way out of — that is the risk this option takes on.

### Loot

Loot never lands on the ground. A kill resolves straight into your inventory — no item to
walk over, no pickup, no despawn timer.

### Inventory

**The backpack has a fixed capacity.** Items can be discarded to make room; discarding
returns nothing, because the alpha has no gold to return.

**A full backpack does not stop the hunt.** The fight keeps running, experience keeps
banking, and further drops are forfeited and counted. Experience is the main progression
track, so ending a run over a housekeeping problem would throw away far more than it saved —
seven remaining hours of a sealed session, in the worst case.

**Forfeiting must never be silent.** Online, the HUD carries a persistent full-backpack
warning from the moment it fills. Offline, the login summary reports when it filled and how
many drops were lost, in the same block as death losses.

*Why a cap at all, given the above:* it is the wall a player can feel and understand. Nothing
in the alpha relieves it except discarding — but a backpack expansion, and an automatic sale,
are the obvious first things to sell if this game is ever monetized. Nothing is being built
for that now; the cap is simply the shape that leaves the door open. See `vision.md`.

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

Reduced 2026-08-24 by the scope audit that produced
[`docs/requirements.md`](docs/requirements.md). Sequencing, character art, the potion
cooldown, the daily-Hard reset, hunt gating, the account model, mana's purpose, inventory
bounds, respec, the fight readout and the isometric/orthogonal contradiction were all
settled and written into the sections above. What is left is numbers.

- **The XP curve to level 30.** Constrained now, not free: roughly thirteen levels have to
  come out of hunt 1 and roughly seventeen out of hunts 2 and 3, and climbing a tier has to
  visibly raise experience per hour or the tier ladder has no pull. Whether three hunts
  carry that is the same question.
- **The numbers.** Wave depth per tier, alive-cap escalation per wave, the boss loot curve
  against clear time, the tier and density multipliers, the shared potion cooldown, the
  backpack capacity, the offline reduction factors, the catch-up cap, and N daily Hard runs.

Both are tuning, and this doc's own Notes table says how to do it: against a headless run of
the simulator, never by playing.

**One thing that is real scope but is not a feature and has no owner yet:** that headless
tuning harness. It produces nothing a player sees, so it earns no row in
`docs/requirements.md`, but every number above is blocked on it existing.

---

## Functional Requirements

An informal staging area — extracted from `architecture-api.md`,
`architecture-web.md` and the old `design.md`, sorted out from the
architecture principles they used to sit next to. Not the formal, append-only
log; that's [`docs/requirements.md`](docs/requirements.md), populated later by
the `msg-pre-roadmap` skill.

| Area | Requirement |
| --- | --- |
| Front-end | Version the event stream, and fail loudly on an unknown version. |
| Front-end | Render deliberately in the past, behind a small buffer, holding both bracketing snapshots. |
| Front-end | Snap rather than replay when far behind on catch-up; keep only the events with lasting visual state. |
| Front-end | Never invent an event the server did not send; extrapolate movement briefly if the buffer starves, then freeze and indicate the stall. |
| Back-end | Assert that a repeated seed produces a byte-identical event stream, in CI. |
| Back-end | Fix the tick rate once and treat it as permanent. |
| Back-end | Cap how much elapsed time a single catch-up will replay. |
| Back-end | Persist the seed and the inputs for each offline session. |
| Back-end | Validate content for referential integrity, not just shape — every skill, prefix and monster a table names must exist, checked at load. |
| Back-end | Offline hunting is a mode the player enters deliberately; a sealed session is replayed exactly once, at the next login. |
| Back-end | A dropped socket is a leave: the character stays in the arena five seconds, then exits and banks. |
| Back-end | Freeze the character's equipment, skill levels and rule list when an offline session is sealed. |
| Back-end | Loot resolves straight into the inventory; nothing is ever an item on the ground. |
| Back-end | An arena exists only in memory, and only while a player stands in it — created on first entry, destroyed when the last player leaves. |
| Back-end | Scale monster count and the alive-cap by the number of players in the arena. |
| Back-end | Bank XP per kill, never at the end of a run. |
| Back-end | Tier, density and party size are multipliers over one hunt definition, never eighteen hand-authored combinations. |
| Design | Item variety comes from roll ranges, not affix combinations. |
| Design | When two income sources multiply, cost growth must beat gain growth squared. |
| Design | Every rate mechanic needs a stated bottleneck — a spawn cap, a cooldown, a timer. |
| Design | One player-hour produces one player's worth of XP and loot — whatever the density, whatever the party size. |
| Design | Two modes promising equal XP per hour must also clear at equal speed. |
| Back-end | Charge mana for every active skill and for no passive skill; an empty pool denies the cast. |
| Back-end | Expose mana in the rule-list condition vocabulary alongside health, so a denied cast is authorable around. |
| Back-end | A skill point both unlocks a skill at level 1 and raises it; a character holds as many points as their level. |
| Back-end | Human Form is known from the start, costs no point and no mana, and can never be unlearned. |
| Back-end | Accept skill-point reallocation only outside an arena; accept spending a newly earned point on any tick. |
| Back-end | Grant base health and base mana per level, and no damage. |
| Back-end | Allow several characters per account, but seal at most one offline session per account. |
| Back-end | Refuse to seal an offline session on Hard tier. |
| Back-end | Apply a stated reduction factor to offline experience and offline drop rates. |
| Back-end | Share one cooldown across every potion of both families. |
| Back-end | Continue the hunt when the backpack fills; forfeit and count further drops rather than ending the run. |
| Back-end | Refill the daily Hard count in full at a fixed UTC hour, from one counter and one date per character. |
| Back-end | Emit the fired row id and a skip reason per skipped row on every tick's cast event. |
| Front-end | Warn persistently and immediately when the backpack fills, and report the loss in the login summary. |
| Front-end | Render the arena on a square 32×32 grid: `screenX = x * 32`, `screenY = y * 32`, `depth = y`. |
| Front-end | Show experience per hour as a rolling five-minute average, never a whole-run average. |
| Front-end | Distinguish physical, fire and electric damage in the floating damage numbers. |
| Front-end | Display a recommended level per hunt on the selection screen, and never enforce it. |
| Design | Offline is the one stated exception to the one-player-hour invariant, and it is deliberate. |
| Design | Every source of raw damage must be either equipped or chosen; nothing grants damage for free. |

## User Needs

The player- or operator-facing motivation behind requirements above, where
the original rule stated or implied one.

| Area | Need |
| --- | --- |
| Front-end | A stale or version-mismatched client's failure must be immediately visible, not a silent rendering of nonsense that's hard to diagnose. |
| Front-end | Players watching a fight need to see smooth motion, not jitter, even though they never issue combat commands directly. |
| Front-end | A player reopening a backgrounded tab needs to see the current result quickly, not sit through a replay of everything that happened while away. |
| Front-end | Players need confidence that everything rendered actually happened in the fight — a fabricated hit would break that guarantee. |
| Back-end | A player must not be able to see a boss's future loot by reading the RNG seed. |
| Back-end | A player returning after months away must not have their login hang or time out. |
| Back-end | A player must not be able to escape death by disconnecting — quitting and crashing must be the same event. |
| Back-end | A party must not be economically worse off than the same players hunting alone. |
| Back-end | A player must never lose experience already earned by leaving, crashing or dying. |
| Front-end | A player whose rule did not fire needs to know which of six possible reasons it was, or retuning is guessing. |
| Front-end | A player must never discover after the fact that hours of drops were silently forfeited. |
| Front-end | A player watching a shapeshift needs to see it, not infer it from a stat panel. |
| Back-end | A player must not be able to out-earn an active player by rolling alts they never play. |
| Back-end | A player must not be forced to end a run early for a housekeeping reason. |
| Back-end | A player must always have a way back to human form, whatever their mana or skill spend. |
| Operator | An operator must be able to change any balance number without a schema change. |

## Notes

Reasoning worth keeping that isn't an architecture principle, a functional
requirement, or a user need — tuning heuristics and the history behind them.

| Area | Note |
| --- | --- |
| Front-end | Placeholder art is acceptable at any stage; only a renderer that owns a rule is not — art has lead time and can be swapped late. |
| Back-end | Write a run header's migration in the same commit as the shape change that needs it — a migration written later is written against a shape you no longer remember. |
| Back-end | Sealing an offline session exactly once at login, rather than resuming a running one, is what keeps catch-up cost from growing with every logout. |
| Back-end | Ground loot is deferred until a feature actually needs spatial loot. |
| Back-end | Eighteen hand-authored tier/density/party combinations would drift apart from each other; five multiplier numbers cannot. |
| Design | A thing with no decision attached is filler — this test is what removed gear, talents and tiers from the design that preceded the alpha. |
| Design | Complexity lives in one system at a time — two half-built systems teach you nothing about either one. |
| Design | Every "no" is a "not yet" — cuts go to `vision.md` with the constraint they imply. |
| Design | Tune against a headless run of the simulator, never by playing — tuning by playing costs real hours per iteration; the same answer from a harness costs seconds. |
| Design | Get one slot's numbers feeling right before generating the rest — six slots × six prefixes × five suffixes is 360 combinations you would otherwise be balancing blind. |
| Design | Linear gains against exponential costs stall — an early model of the preceding design put its last zone at 1.8 million hours, a curve that was wrong in a way invisible on paper. |
| Design | The roll-range approach to item variety costs far less to balance than affix combinations — an affix rolling +5% to +15% creates more chase than thirty distinct affix pairings. |
| Design | The income-multiplier squared-cost rule was a real bug, not a hypothetical — an earlier model let alternating purchases outrun the price curve and the game finished in 85 minutes. |
| Design | Two equal-XP modes must clear at equal speed because boss loot scales with clear time — a slower mode would otherwise be punished twice for being slower. |
| Design | A fixed UTC reset lets a player awake at the boundary double one night's high-tier income; the simpler counter was chosen over a rolling recharge with that leak known. |
| Design | The shared potion cooldown is the harshest option considered — watch for death spirals a rule list cannot escape, and split it into two family cooldowns if they appear. |
| Design | The backpack cap is the one wall in the alpha with no in-game relief; that is also what would make a backpack expansion and an automatic sale the first two things worth selling. |
| Design | Skill points reallocating freely mid-fight was rejected as degenerate — a pool with no opportunity cost gets re-optimised every wave, which is the micromanagement the rule list exists to replace. |
| Design | Gating hunts by level would gate the wrong axis: tier is the difficulty dial, and hunts 2 and 3 are a resistance choice rather than a rung above hunt 1. |
| Front-end | "32×32 isometric" was a contradiction — Tibia is an orthogonal top-down grid, a real isometric tile is 64×32, and free 32×32 art is overwhelmingly top-down. |
| Front-end | CC0 rather than open-source generally: CC-BY and OGA-BY oblige credit in the medium, and CC-BY-SA is viral — much of the LPC set in particular. |
| Front-end | Static sprites are enough for the alpha, but they must be real sprites — an invisible form change makes the whole shapeshifting build unreadable. |
