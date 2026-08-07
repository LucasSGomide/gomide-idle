# Game Specs — Part 1: The Game Design

> Status: **decided in interview, not yet balanced.** This document covers section 1.1 of
> [IDLE-GAME-GUIDE.md](IDLE-GAME-GUIDE.md) — "Decide the game before writing code". Numbers marked
> `TBD` come from the balance spreadsheet, which is the next task. Nothing here is code yet.
>
> Rule for reading this: everything under **Decided** is settled. Everything under **Open** is a
> real question that still needs an answer. Everything under **Risks accepted** is a thing that can
> hurt, that we decided to keep on purpose.

---

## 1. The core loop, in one sentence

> **Pick a hunting ground, your hero fights waves of monsters against a timer, you bank XP and gold
> per kill, the boss at the end drops gear — stronger gear and talents let you survive and clear
> harder grounds.**

Expanded, the loop is:

```
choose zone  →  hero auto-fights waves  →  boss  →  gear drops
     ↑                                                   ↓
     └────  spend gold on refine/respec  ←  equip, spend talent point
```

The player never clicks during a fight. All the play is in the decisions *between* runs.

---

## 2. Progression spine — what goes up

Two tracks, on purpose, because they feel different:

| Track | Source | Feel | Speed |
| --- | --- | --- | --- |
| **Gear** | Boss drops, refinement | Big, loud jumps | Spiky — a drop can change everything |
| **Level → talents** | XP per kill | Small, steady | Slow ramp, always moving |

**Design intent, stated explicitly:** *character upgrades must feel meaningful.* When something
changes, the player should be able to feel it in the next run — not read about it in a tooltip.

- **Gear is the impact.** A weapon upgrade is the moment.
- **Talents are the ramp.** One point per level, always something to click, never a spike.

### Stats (v1 keeps it deliberately small)

Only **two** stats decide a fight in v1:

| Stat | What it does | Where it mostly comes from |
| --- | --- | --- |
| **Attack** | How fast you kill → how much of the run you clear before the timer | **Weapon (dominant)** |
| **Defense** | Whether you survive the waves and the boss | Armor, helmet, boots, gloves, rings |

Rules that fall out of this:

- The **weapon dominates Attack**. It is the single most important item in the game.
- **Attack alone does not clear a zone.** You can out-damage the timer and still die to wave 7.
- **Defense alone does not clear a zone.** You can survive everything and still time out.
- Speed / accuracy / crit / elemental resistances are **deferred** (see §9).

**Every item carries its own attribute spread** — in v1 that means some mix of Attack and Defense,
not a single "power" number. Two items of the same tier can be a real choice.

**UI requirement:** when an item drops, the player sees it **compared directly against the item
currently in that slot** — same attributes, side by side, differences marked. No mental arithmetic,
no opening two screens. This is how the trade-off in §7 actually reaches the player.

---

## 3. The run — the unit of play

A **run** is one attempt at one hunting ground.

```
enter zone → wave 1 → wave 2 → ... → wave N → BOSS → run complete
             ▲                                          │
             └──────── timer expires: reset ────────────┘
```

### Rules

| Thing | Rule |
| --- | --- |
| Structure | Scaling waves, boss at the end |
| Timer | One timer for the whole run (waves + boss). `TBD` per zone. |
| XP / gold | **Banked per kill**, continuously during the run |
| Gear | **Boss only** — the boss is the loot piñata |
| Run complete | Boss dies → gear rolls → zone resets → hero re-enters automatically |
| **Timeout** | Player loses **25%** of the XP banked *on that run*, zone resets to wave 1, hero **auto-restarts** |
| Death | See §4 |

### Run length target

Runs **grow with zone depth: ~2 minutes in zone 1 → ~10 minutes in zone 5.** Later zones feel
weightier and the boss feels like an event.

> ⚠️ **Known tension (accepted).** The guide's rule is "time-to-next-thing is the real currency,"
> and a 10-minute run means a 10-minute gap between gear drops in the late game. The mitigation is
> already in the design: **XP and gold bank per kill**, so something is always ticking up during
> those 10 minutes. If late-game still feels dead in playtesting, the lever to pull is shortening
> zone-5 runs, not adding a new system.

---

## 4. Risk, death, and the timer — the tension system

This is deliberately old-school (MuOnline-flavoured). It is the harshest part of the design and
that is intentional.

### On death

| Penalty | Value |
| --- | --- |
| Gold | Lose a % of carried gold | `TBD%`, **config** |
| XP | Lose a % of XP | `TBD%`, **config** |
| **De-level** | **Allowed.** Enough XP loss drops the player a level, taking the stat gain and the talent point with it. |
| Gear | Never lost, never damaged |

### After death — player setting

The player sets this themselves, per account:

- **Stop** — hunting ends. Safe.
- **Retry** — hero re-enters the same zone and keeps trying, forever.

There is **no automatic guard rail.** A player who sets `Retry` on a zone they cannot beat can lose
levels overnight. That is their choice.

**The obligation this creates:** the game must *inform the risk clearly, every time.* This is a
hard requirement, not polish:

- Zone entry shows a difficulty warning when the player is under the recommended level.
- The warning states plainly that death costs gold and XP and **can lose a level**.
- Choosing `Retry` requires an explicit confirmation that spells out the overnight risk.
- The login summary must show de-levels loudly (`"You lost 2 levels"`), never buried in a list.

### On timeout

Separate from death, and softer: **-25% of the run's banked XP**, reset, auto-restart. Timing out
is the "you're close, but not there yet" signal. Dying is the "you do not belong here" signal.

---

## 5. Zones

| Rule | Decision |
| --- | --- |
| v1 count | **5 hunting grounds** |
| Unlock | **By character level** — each zone has a recommended level |
| Entry | **Free.** Any player can enter any zone at any time. |
| Under-leveled | Allowed, with a visible warning (see §4) |
| Boss | **Gear source only** — it does *not* gate the next zone |

### Zone selection is a boss chase

This is the reason a player picks one zone over another, and it matters more than raw progression:

> **You target-farm.** You want a specific item. You look up which boss drops it. You run that zone
> until it drops.

Consequences, all of them requirements:

- **Every boss has its own identity and its own loot table.** No shared global drop pool. Boss 3
  drops *these* items; if you want them, you run zone 3 — even if zone 4 is "better".
- **Loot tables must be visible to the player.** You cannot target-farm what you cannot see. The
  boss screen lists what it can drop.
  - *Show the item list. Do **not** show exact drop rates* — the guide's rule about not sending
    the client anything it doesn't need to render still holds, and hidden rates keep the chase alive.
- **Zone choice stops being purely "go as deep as you can".** A level-45 player may deliberately
  farm zone 2 because that boss holds the weapon their build wants. That's a feature.
- **This makes free entry (above) matter more.** Wanting an item from a zone you're under-leveled
  for is exactly the moment a player accepts the de-level risk on purpose.
- **Content design rule:** items must be *spread* across bosses, not concentrated in the last one.
  If the deepest boss drops everything good, there is no chase — only a ladder.

Rough shape (all `TBD`, to be set in the spreadsheet):

| Zone | Recommended level | Target run length |
| --- | --- | --- |
| 1 | 1 | ~2 min |
| 2 | ~10 | ~4 min |
| 3 | ~20 | ~6 min |
| 4 | ~30 | ~8 min |
| 5 | ~40 | ~10 min |

---

## 6. The wall

**The wall is a two-sided check, and both sides must pass.**

| If you lack... | What happens | The fix |
| --- | --- | --- |
| **Defense** | You die in the waves or to the boss. Lose gold and XP, maybe a level. | Better armor, defensive talents |
| **Attack** | You survive but the timer beats you. Lose 25% of the run's XP. | Better weapon, refinement, offensive talents |
| **Both** | You die fast and early. | Go back a zone. |

This is what makes "the weapon is dominant, but damage alone can't clear a room" true in the
mechanics and not just in the pitch. A player who stacks only weapon dies. A player who stacks only
armor times out. **The build decision is where to sit between them, per zone.**

Because entry is free, the wall is *soft* — nothing stops you walking into zone 5 at level 12. The
wall is enforced by consequences (lost XP, lost levels, wasted hours), not by a locked door.

---

## 7. The decisions the player actually makes

An idle game where you press start and wait is not a game. The real decisions, in order of how
often they come up:

1. **Which zone to run — and *why*.** Two reasons pull against each other: *progress* (go as deep
   as you safely can) and *the chase* (farm the boss that drops the item your build needs, even if
   it's an "easier" zone). Plus the risk question on top: push up and gamble levels, or stay safe?
2. **What to equip.** Weapon = Attack, everything else = Defense. Trading a defense piece for a
   damage piece to beat a timer is the core puzzle. Every drop is presented **side by side with the
   currently equipped item**, so the trade-off is visible without doing math.
3. **Where to spend the talent point.** One per level, into a real tree (§8). Reversible only by
   paying gold.
4. **What to spend gold on.** Refinement (permanent small power) vs. saving for a respec.
   A genuine trade-off, because both come from the same pool.
5. **Stop or Retry on death.** A standing bet the player places on their own build.

---

## 8. v1 content scope

**Ship one class, one specialization branch.** Prove the loop before multiplying anything.

| Thing | v1 |
| --- | --- |
| Classes | **1** (Druid, per existing notes) |
| Specs | **1 branch** |
| Level cap | **50** |
| Zones | **5** |
| Talent points | 1 per level = 50 total |
| Talent tree | **~12 talents, up to 5 ranks each**, some gated behind "spend N points in this tree" |
| Respec | **Paid with gold**, price escalates per respec |
| Gear slots | `TBD` — weapon + armor pieces |
| Item tiers | Normal → Superior → Perfect → Unique (per existing notes) |
| **Refinement** | **IN.** Gold-for-power, small permanent steps. This is the main gold sink. |

### Explicitly NOT in v1

Saying no now so it's easy to say no later:

- ❌ PvP, chat, guilds, trading, friends — anything social
- ❌ Crafting
- ❌ Set items and set bonuses *(wanted, but they only mean something with lots of gear — v1 has 5 zones)*
- ❌ Prestige / reset-for-multiplier loops
- ❌ Achievements, daily quests, events
- ❌ Second and third specialization branches
- ❌ Any visual layer — v1 is HTML buttons and text (Phase 1 of the guide)

---

## 9. Deferred mechanics (designed for, not built)

These are things v1 leaves out but must not *block*. The data model should have room for them:

- **Speed** as a third stat (attack speed / kills per hour multiplier)
- **Accuracy vs. Evasion** — the MuOnline "high level monsters are hard to hit" wall
- **Crit chance**, elemental damage and resistances
- **Item glow scaling with refinement level** (per existing notes — Phase 2 visual)
- **Class-specific vs. universal items**
- **Gear durability / repair** as a second gold sink

---

## 10. Offline progress

| Rule | Decision |
| --- | --- |
| Rate | **Identical to online.** No offline penalty, no offline bonus. |
| Cap | **12 hours** |
| Configurability | **Both the rate multiplier and the cap must be config values**, changeable without a deploy |
| Method | **Closed-form formula. No wave-by-wave simulation.** |

### How the catch-up math works

Because a run is waves + boss + timer, offline progress can't be a naive "kills per hour". The
server computes it as **whole runs**:

```
given: player stats, zone stats, elapsed time (capped at 12h)

  runDuration        = f(attack, zone)        -- how long a clear takes
  clearProbability   = f(attack, defense, zone, timer)
  deathProbability   = f(defense, zone)

  totalRuns          = elapsed / runDuration
  cleared            = totalRuns × clearProbability      → full XP + gold + boss loot rolls
  timedOut           = totalRuns × timeoutProbability    → 75% of that run's XP, no gear
  deaths             = totalRuns × deathProbability      → penalties applied, then Stop or Retry
```

**Hard requirements that follow from this:**

- The live (per-tick) resolver and the offline (rate) resolver **must agree statistically.** This is
  a test, not a hope — run both for a simulated hour, assert the outcomes match.
- Randomness uses a **seeded PRNG stored on player state**, never `Math.random()`.
- Time comes from the **server clock only**. Never the browser.
- Calling catch-up twice in a row must be a **no-op** (elapsed = 0).
- Death handling offline must respect the player's **Stop / Retry** setting — `Stop` means the
  simulation halts at the first death and the remaining hours earn nothing.

---

## 11. The login moment

When a player returns, the first thing they see is a **summary report** — this screen *is* the
reward of an idle game, so it gets real design attention:

```
  You were away 11h 42m

  Zone 3 — The Sunken Vault
  ────────────────────────────────
  Runs completed        96
  Runs timed out        24
  Deaths                 3        ← loud if a level was lost
  XP gained         48,220        (+3 levels)
  Gold gained       12,940        (−1,410 lost on death)
  Gear dropped           2        ← rare drops get disproportionate fanfare

  [ Collect ]
```

Requirements:

- De-levels are shown **loudly and first**. Never hidden.
- Rare drops get a disproportionate moment. That is why people come back.
- The summary is produced by the same catch-up call that advances state — it is not a separate
  query.

---

## 12. Onboarding — the first 60 seconds

The first minute decides everything. The sequence is fixed:

1. **Pick a class.** The only choice, and in v1 there is one option — so it's really a name and a
   fantasy, not a decision.
2. **Tutorial run.** A guided first run through zone 1 that explains, in order: waves → the timer →
   the boss → equipping.
3. **Guaranteed weapon.** The tutorial boss **always** drops a class weapon. Not a chance. A
   certainty.
4. **Equip it, feel it.** The player equips the weapon and the very next run is visibly faster.
   That is the whole game taught in one loop.

> The guaranteed drop is doing the heavy lifting here. The first thing a new player learns is
> *"gear changes everything"*, which is the true statement about this game.

---

## 13. Risks accepted (decided with eyes open)

| Risk | Why we're keeping it | Early warning sign |
| --- | --- | --- |
| **De-level + free zone entry + Retry** means a player can wake up weaker than they slept | It's the player's own informed choice, and the danger is the point | Playtesters lose a level once and quit |
| **10-minute late-game runs** stretch the gap between rewards | Weightier bosses; per-kill XP keeps something ticking | "It got boring around zone 4" |
| **1 class / 1 spec** means build variety is unproven in v1 | Scope. Prove the loop first. | Talent choices feel obvious — there's only one good build |
| **Waves + boss + timer** is harder to model offline than a flat monster stream | It's a better game; the formula in §10 handles it | Online and offline results drift apart in the parity test |
| **Refinement in v1** is one more system before first playtest | Gold needs a purpose beyond respec | Balancing refinement eats the schedule |

---

## 14. Open questions — next tasks

**Balance spreadsheet (do this before any code):**

- [ ] XP curve to level 50, and time-to-level at each zone
- [ ] Gold income per run vs. refinement cost curve (the ~1.07–1.15× ratio)
- [ ] Attack and Defense requirements per zone — the actual wall numbers
- [ ] Timer length per zone, derived from target run length (2 → 10 min)
- [ ] Death penalty percentages (gold and XP) — the config defaults
- [ ] Respec cost curve
- [ ] Boss drop rates per item tier

**Design still undecided:**

- [ ] How many gear slots, and which ones carry Defense
- [ ] Refinement: max level, failure chance (can it break?), material or pure gold
- [ ] The ~12 talents themselves — what each one actually does
- [ ] Wave count per zone and how monsters scale within a run
- [ ] Is the "Unique" tier a drop, or only reachable through refinement?
- [ ] **Per-boss loot tables** — which items live behind which boss, spread so that no single boss
      is the only place worth farming
- [ ] Exactly how much of a loot table is revealed before you've seen the item drop once
- [ ] Class name and identity (the guide notes: check the name isn't taken early)

**Engineering follow-ups this document creates:**

- [ ] Every number in §4, §5, §10 is content/config, not a constant in code
- [ ] Content is data (JSON validated at boot), per the guide
- [ ] Parity test: tick resolver vs. rate resolver
- [ ] Balance test: "a fresh account reaches level 10 in 20–40 minutes"
- [ ] Combat emits events from day one, even with nothing rendering them
