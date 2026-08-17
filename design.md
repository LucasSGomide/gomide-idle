# Design — 0.1.0

The whole game, on one page: the model, the content, and the two decisions. This page does not say
*in what order* to build it — that's [`roadmap.md`](roadmap.md), which supersedes any sequencing
implied below. The economy numbers here were checked by a balance script (`tools/balance.mjs`,
since removed — see `roadmap.md` Step 3, which calls for its XP-based successor before more than 2
zones ship); re-derive them by hand or with a new script before changing a formula or a zone row.

Anything not on this page is not in 0.1.0. It's in [`vision.md`](vision.md).

## The core loop

> **Pick a zone. Your hero kills monsters there forever. Gold accrues. You spend it on Attack or
> Loot — and the best zone to be in changes as you get stronger.**

```
choose zone  →  hero auto-kills  →  gold  →  buy Attack or Loot  →  stronger
     ↑                                                                  │
     └──────────────────────────────────────────────────────────────────┘
```

The player never clicks during a fight. There is no fight — there's a rate. All the play is in the
two decisions below.

## The model

Five formulas. That's the entire game.

```
attack      = 1.10 ^ attackLevel
lootMult    = 1.10 ^ lootLevel

damage      = max(attack − zone.armor, 0)
killTime    = zone.hp / damage
goldPerSec  = zone.gold × lootMult × damage / zone.hp

costAttack(n) = 10  × 1.25 ^ n      -- n = current level, price of the next one
costLoot(n)   = 100 × 1.25 ^ n
```

Both upgrade tracks start at level 0, so a new hero has `attack = 1`, `lootMult = 1`.

**No XP. No levels. No gear. No death. No boss. No timer.** A monster is three numbers and it
always dies.

## The content

Three zones. Three numbers each.

| Zone | HP | Armor | Gold/kill | gold÷HP | Becomes the best zone at | ≈ time |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 | 0 | 1 | 0.1 | start | 0 |
| 2 | 400 | 25 | 120 | 0.3 | attack 41 (`attackLevel` 39) | ~9h |
| 3 | 20 000 | 600 | 20 000 | 1.0 | attack 869 (`attackLevel` 71) | ~21h |

**The gold÷HP column is the load-bearing one.** It must increase with depth. If two zones share a
ratio, the one with more armor is strictly worse and the player never moves — this was a real bug
in the first pass of the balance model.

## The two decisions

**1. Attack or Loot?** Same gold pool, so buying one is explicitly not buying the other.

- **Attack** → kill faster, *and* it's the only thing that opens deeper zones.
- **Loot** → more gold per kill. Compounds faster short-term, but buys no progress.

Pure Loot stalls forever in Zone 1. Pure Attack leaves gold on the table. The optimum alternates,
and it isn't obvious without doing arithmetic — which is exactly the property that makes it a
decision rather than a button.

**2. Which zone?** The answer changes as you grow, and it changes *twice* over the game. A zone
you've outgrown is genuinely worse, and a zone you're not ready for pays zero. The player has to
notice.

## The wall

**Armor.** If `attack ≤ zone.armor` you deal exactly zero damage and earn exactly nothing.

Not a locked door, not a warning dialog — the number is simply zero. You can select Zone 3 at
attack 5 and watch nothing happen. The fix is always the same and always legible: buy Attack.

This is the whole reason armor exists in the model. Without it, deeper zones would just be
better-paying versions of shallow ones and there'd be no reason to ever leave the last one.

## Offline progress

The point of an idle game, and here it's nearly free:

```
elapsed = min(now − lastSimulatedAt, 12 hours)     -- server clock only
gold   += goldPerSec(state, zone) × elapsed
lastSimulatedAt = now
```

`goldPerSec` is constant for a given state and zone, so **offline progress is exact, not
approximated** — one multiplication. The live tick uses the same function at a smaller `elapsed`.
There is no second resolver to keep in sync and no statistical parity test to write, because
online and offline are literally the same line of code.

That property is worth protecting. If a future mechanic makes the rate non-constant (drops,
crits, death), offline stops being closed-form and this gets much harder. See `vision.md`.

- Cap: **12 hours**, config value.
- No offline penalty, no offline bonus. Same rate awake or asleep.
- Calling catch-up twice in a row is a no-op — `elapsed` is zero.

## How it's built

**Server-authoritative** is the target architecture, not the v0 starting point — per
[`roadmap.md`](roadmap.md) Step 4, v0-v3 run this same model client-side (`localStorage`, a browser
tick loop) behind a `simulate`/`applyCommand` boundary designed so the swap below is additive, not a
rewrite. The client sends intent, the server owns state and the clock.

| Piece | Choice |
| --- | --- |
| API | NestJS + Drizzle + Postgres |
| Client | React + Vite + Tanstack Query — the client's state is a **cache**, never the truth |
| Auth | A provider, not hand-rolled |
| Simulation | Pure functions, no I/O: `simulate(state, elapsed, content) → { state, events }` |
| Content | The zone/cost tables above are **JSON validated at boot**, not constants in code |
| Time | Server clock only. Never `Date.now()` from the browser. |

Two client actions and one read. That's the entire API surface:

```
POST /catch-up          → advances state to now, returns state + summary
POST /upgrade  { track: 'attack' | 'loot' }
POST /zone     { zoneId }
```

Every one of them runs catch-up first, so state is always current before a decision applies.

The visual layer is **not** in 0.1.0 — this is HTML buttons and text. But combat emits events
(`MonsterKilled`, `GoldEarned`, `ZoneChanged`) from the start, because retrofitting an event
stream later means paying for it twice.

## Done when

This is the model fully built out, which per [`roadmap.md`](roadmap.md) lands across Steps 0-4, not
on day one:

- [ ] Gold accrues live while the tab is open
- [ ] Close the tab, come back hours later, get correct offline gold
- [ ] Both upgrades purchasable, prices escalate, the trade-off is felt
- [ ] All three zones reachable, and switching zones visibly changes income
- [ ] Selecting a zone above your attack earns zero, legibly
- [ ] Playable through ugly HTML buttons — **and I still want to keep playing**
- [ ] Combat emits events, even though nothing renders them
- [ ] Register, log in, hero persists server-side (Step 4 — not required before it)

## Open

Only two things are genuinely undecided:

- [ ] **Zone 2 at ~9h may be too slow for a first transition.** It's one overnight absence, which
      may be correct for an idle game or may be a dead first session. Answer by playing it, not by
      arguing about it. It's a config value. → If the fix turns out to be "everything feels too slow"
      rather than "zone 2 specifically," prefer a single global multiplier over hand-edited zone
      numbers — same effect, and it stays a config change instead of three coordinated edits.
- [ ] **A name for the game.** Check it isn't taken before it's in 50 files.

Everything else that used to be an open question was a question about a system that no longer
exists in 0.1.0.

## Accepted risks

| Risk | Why we're keeping it | Early warning sign |
| --- | --- | --- |
| **The game has no content** — three zones, two buttons, no gear, no drops. Nothing to discover. | 0.1.0 exists to prove the loop and the offline math, not to entertain. Content is the easy part to add and the hard part to balance. | You get bored before hour 2 — which means the *curve* is wrong, not the content |
| **Full server stack for a game this small** means most of the work is auth, migrations and deploys rather than game mechanics | Chosen deliberately: it keeps the door open for a public game and no rewrite is needed later | The first monster hasn't died three weekends in |
| **Numbers came from a script, not from playing** | A model that's wrong in an obvious way is better than `TBD`; and it caught two real design bugs already | Playtesting disagrees with `tools/balance.mjs` |
| **No spawn cap — the model is permanently damage-capped.** There's no monster count or respawn rate, so buying Attack always pays off, forever; there's no regime where killing faster stops mattering. | Correct for 0.1.0's "two decisions" scope — a spawn cap would add a second bottleneck to reason about before the first one (Attack vs. Loot) is even proven fun. | A future zone/boss system adds anything with a respawn timer without this line being revisited — see [`vision.md`](vision.md)'s waves/bosses constraint |

## Design principles

Carried over — these are the rules that produced the cuts, and they're what to re-read when scope
starts creeping:

- **0.1.0 exists to teach me how a game is built.** Simple beats clever. A working engine I
  understand end to end, not a deep game.
- **A thing with no decision attached is filler.** Every zone, stat and upgrade must answer "what
  choice does this create?" This test is what removed gear, talents and tiers.
- **Complexity lives in one system at a time.** Right now that system is the economy curve.
- **Every "no" is a "not yet."** Cuts go to [`vision.md`](vision.md) with the constraint they
  imply, so nothing here blocks them at the data-model level.
