# Roadmap — v0 to v1

A build order, not a design doc. Every system named here is already designed (or deliberately
left undesigned) in [`vision.md`](vision.md) or [`design.md`](design.md) — this document only
answers *in what order* and *what has to be decided first*.

**Status:** accepted for sequencing. This roadmap owns build order; `design.md` owns the model,
content and formulas, and defers here for order. The server-authoritative stack lands at **Step
4**, zones at **Step 3**.

**Unresolved:** Steps 1-3 build an XP/leveling growth loop (`XpGained`, `LeveledUp`, a level curve
driving `attack`), while `design.md`'s model has no XP or levels — growth there is buying `attack`
and `lootMult` directly with gold, and "Attack or Loot?" is *the* first decision. Neither doc
currently says which one is the real v0 model, or whether Steps 1-3 above should be read as
superseding `design.md`'s formulas rather than just its sequencing. Resolve before starting Step 1.

---

## How to read this doc

Each step says:
- **Adds** — the one dimension of complexity this step introduces, and nothing else.
- **Decide first** *(only when non-empty)* — architecturally-defining choices: expensive to
  change later, so they're made (briefly) before code, even if that means a short doc ahead of the
  step. If a step has no entry here, figure it out while coding it.
- **Skip** — the traps: near-miss designs that look like this step but aren't.

A decision counts as "architecturally defining" if changing it later means rewriting the state
shape, the module boundary between simulation and rendering, or the offline-catch-up math — not if
it just means editing content (a new zone, a new item, a new number).

---

## Step 0 — Architecture skeleton (no game yet)

**Adds:** the module boundary everything else builds on. No player-visible content.

Three modules, decoupled from day one so v0 can run fully client-side while staying shaped like a
future Colyseus room:

```
core/state.ts      → plain, serializable state shape (candidate for a Colyseus Schema later)
core/simulate.ts   → simulate(state, elapsed, content) → { state, events }   (pure, no I/O)
core/commands.ts   → command handlers (the future room's onMessage handlers), e.g.
                      applyCommand(state, command, content) → { state, events }
```

- `simulate` is pure and deterministic: same inputs, same outputs. This is what makes offline
  catch-up "one function call, not a second resolver" (see Step 1) and what makes a later
  Colyseus room a thin wrapper (`room.state = simulate(...)` on a tick, `room.onMessage(cmd) =>
  applyCommand(...)`) instead of a rewrite.
- Content (class stats, enemy stats, zone tables, costs) is JSON, not constants in code, and
  validated at load. A new number is a content edit; a new *dimension* is what triggers a roadmap
  step.
- v0's "server" is a `setInterval`/`requestAnimationFrame` loop running in the browser tab, calling
  `simulate` on a fixed tick and persisting `state` to `localStorage`. No network call, no
  Postgres, no auth — but the call signature doesn't change when those arrive later, only what's on
  the other side of it does.
- Rendering is a separate module that only reads `state` and the `events` array — never mutates
  state directly, never computes damage or timers itself. This is the seam PixiJS slots into later
  without touching `core/`.

**Decide first:**
- **The `simulate`/`applyCommand`/state-shape boundary above.** This is the one decision the whole
  roadmap leans on — every later step (server authority, multiplayer, visuals) assumes simulation
  and rendering never merge back together. Getting the function signatures right here is cheap;
  un-tangling rendering from simulation after they've merged is not.
- **Tech stack: Colyseus + PixiJS is a leaning, not locked.** Nothing before the visual layer
  (Step 9) or real networking (Step 10) actually requires either library — v0-v8 only require "a
  tick loop and a render function," which is stack-agnostic. Confirm the choice no later than
  immediately before Step 9, because PixiJS's scene-graph model and Colyseus's `Schema` class do
  shape how `core/state.ts` should already be laid out by the time you adopt them. Revisit then
  rather than guessing now.

**Skip:** don't add a `content/` loader for *every* future data shape (items, talents, classes) yet
— add the fields each step actually needs, when it needs them. A generic "everything is data"
engine designed before there's a second content type is speculative architecture.

---

## Step 1 — The smallest playable loop

**Adds:** one class, one enemy type, an idle kill loop, XP and gold as rewards, levels as the only
form of growth. No player decisions yet — nothing to choose, only something to watch.

- Hero has one stat (attack) that increases via a level curve driven by XP.
- One enemy, fixed HP/armor/XP/gold-per-kill, always dies eventually (`attack` starts above its
  armor, or armor is 0 — no wall yet).
- `events` stream emits `MonsterKilled`, `XpGained`, `GoldEarned`, `LeveledUp` from the start (same
  reasoning `design.md` already gives for events: retrofitting later costs more than emitting one
  from day one).
- Rendering is plain text/HTML: level, XP bar, gold counter, kill count. No sprites.

**Decide first:** nothing new — this step is Step 0's skeleton with its first content plugged in.

**Skip:** don't add a second enemy or a zone concept "while you're in there." v0 per the brief is
explicitly single-enemy, single-class, no gear, no zones — resist scope creep here more than
anywhere else, since this is the step that proves the skeleton before anything is built on it.

**Done when:** the loop runs unattended, leveling is visible and feels like it's going somewhere,
and closing/reopening the tab resumes correctly from `localStorage`.

---

## Step 2 — Offline catch-up

**Adds:** the thing that makes it an *idle* game rather than a clicker — progress while the tab is
closed.

- `elapsed = min(now − lastSimulatedAt, cap)`, then one call to `simulate(state, elapsed,
  content)`. Because `simulate` is already pure and rate-based (Step 0), offline and online are
  the same code path at different `elapsed` values — no second resolver to write or keep in sync.
- Login/reopen summary is a degenerate one-liner for now ("you earned N gold, reached level N") —
  the real summary screen is Step 11.

**Decide first:** nothing architectural — Step 0 already paid for this. The only real question
(offline cap length, e.g. 12h) is a config value, decide by playing it.

**Skip:** don't build any UI polish for the summary yet (animations, fanfare) — that's Step 11's
job and doing it now means redoing it once de-levels and rare drops exist to react to.

---

## Step 3 — Zones and the wall

**Adds:** more than one hunting ground, and the first real player decision: *which zone.*

- Multiple zones, each with its own HP/armor/XP/gold table (data, not code).
- The wall: `attack ≤ zone.armor` → zero damage, zero income, no lock — just a legible zero
  (`design.md`'s existing framing of this is correct and carries over unchanged).
- Zone selection becomes a command (`applyCommand(state, { type: 'selectZone', zoneId }, ...)`).

**Decide first:**
- **Zone data schema** (`{ id, hp, armor, xpPerKill, goldPerKill, name }` at minimum) — short,
  content-only, doesn't need a doc beyond the schema itself in code/comments.
- **Is the gold÷HP (or now gold÷time) ratio still the load-bearing balance check?** `design.md`'s
  existing rule — a deeper zone must pay better per unit time, or the player never moves — still
  applies verbatim. Re-run whatever the equivalent of `tools/balance.mjs` is against the new
  XP-based model before shipping more than 2 zones, or the same bug `design.md` already hit once
  will recur.

**Skip:** don't add zone *unlock requirements* beyond the armor wall yet (no gating by level, no
quest). One mechanism for "why can't I go here" is enough until a second one earns its keep.

---

## Step 4 — Server authority, persistence, auth

**Adds:** the actual server. This is where `design.md`'s existing stack decision (NestJS + Drizzle
+ Postgres, a real auth provider) finally lands — deliberately late, because everything through
Step 3 was designed to not need a rewrite when it arrives.

- The client's local tick loop is replaced by a server process running the same `simulate`/
  `applyCommand` functions on a schedule (still not Colyseus yet — a plain NestJS endpoint or
  worker calling the same pure core is enough).
- `POST /catch-up`, `POST /upgrade` (or whatever the current command set is), one `GET` for state —
  `design.md`'s "two actions and a read" shape still applies, just with more command types by now.
- State moves from `localStorage` to Postgres. Client state becomes a cache (Tanstack Query),
  never the source of truth — `design.md`'s existing rule, unchanged.
- Auth via a provider, not hand-rolled (`design.md`'s existing decision, unchanged).

**Decide first:**
- **Migration path for `core/`.** If Step 0's boundary held, this step should touch zero lines in
  `core/state.ts`, `core/simulate.ts`, `core/commands.ts` — only what calls them changes (a server
  loop instead of a browser interval, Postgres instead of localStorage). If it doesn't hold
  cleanly, that's a signal the boundary needs fixing *before* piling more steps on top of it, not
  after.
- **Server-vs-client authority boundary**, if any part of it was left ambiguous — but per
  `design.md` this was already decided (server owns state and the clock, client sends intent
  only), so this is confirmation, not a new decision.

**Skip:** don't add Colyseus here. A plain request/response API is sufficient for single-player
server authority; Colyseus's value (rooms, real-time state sync to multiple clients) only pays off
once Step 10 (real multiplayer) is in scope. Adding it now is paying a complexity cost with no
buyer.

---

## Step 5 — The second currency decision (talents)

**Adds:** a spend decision that isn't gear — vision.md's talent tree, sized down for a first pass
(a handful of talents, not all ~12/5-ranks/50-cap at once).

- One point per level, spent on small permanent bonuses. This is deliberately the *ramp* against
  the *spike* gear will introduce next — building it first means Step 6 has something to compare
  against.

**Decide first:**
- **Talent data schema** (`{ id, ranksMax, costPerRank, gatedBehind? }`) — content-shaped, low
  risk, decide while coding the first 3-4 talents rather than designing all ~12 upfront.

**Skip:** don't build the "spend-N-points-to-unlock-tier-2" gating yet if the first talent set is
small enough not to need it — add gating when there are enough talents that flat access stops
making sense.

---

## Step 6 — Gear (single stat, single axis)

**Adds:** items, slots, and equip/unequip as a decision. Attack is still the only stat gear
touches — this step is about the *slot and equip* mechanism, not about item variety yet.

- Three slots (weapon, shield, armor) with the 2H-weapon-locks-shield fork — `vision.md`'s existing
  design for this, cut from an earlier pass, gets rebuilt here.
- Items as strict ladders within a slot (bigger number wins) — deliberately boring gear, on
  purpose, so the *system* (slots, equip, inventory) is proven before item variety (Step 8) makes
  comparison actually interesting.

**Decide first — this is the roadmap's highest-stakes decision, and `vision.md` already flags it:**
- **Item stat shape.** Items must be `{ attack, defense, ... }` bags with a `slot` field from the
  start, even though only `attack` is populated today. Adding a slot later is then a content edit;
  adding it as an afterthought means migrating every item record. Write this as a short schema
  note (not a full doc) before the first item exists.
- **Where equip state lives in `core/state.ts`** — inventory + equipped-items-per-slot needs to be
  part of the serializable state from the start, since it's read by `simulate` every tick
  (equipped gear affects `attack`).

**Skip:** no item tiers, no drops yet — every item in Step 6 can be a static reward or shop
purchase. Tiers and drop tables are Step 8.

---

## Step 7 — Defense, and monsters that can hurt back

**Adds:** the second stat axis. Attack still decides whether you beat a timer; defense now decides
whether you survive one — `vision.md`'s framing, built here for the first time.

**Decide first:**
- **Extend the stat resolver past `{ attack }`.** `vision.md` already flags this exact line: the
  model must grow to a real `{ attack, defense }` resolution step without a rewrite. Because Step 6
  already made items stat-bags, this is mostly "read `defense` where it was previously ignored" —
  confirm that's actually true before starting, since it's the check that Step 6's decision paid
  off.
- **Does damage-to-player make death possible yet, or is defense purely a mitigation number for
  now?** Recommend: mitigation only in this step, death deferred to Step 12 — introducing "you can
  die" and "you can lose levels" in the same step conflates two decisions that `vision.md` treats
  separately.

---

## Step 8 — Item tiers and drop tables

**Adds:** Normal → Superior → Perfect → Unique tiers, dropping from kills/bosses, weighted by zone
depth. This is where gear stops being a shop ladder and starts being loot.

**Decide first:**
- **Drop-table shape** (`{ itemId, tier, weight, minZoneDepth }`) — content-only, low risk.

**Skip:** no Unique *effects* yet (see Step 13) — a "Unique" at this step is just top-of-ladder
stats, nothing rule-breaking. Don't let tier design quietly grow a bespoke-effects system; that's
its own step because `vision.md` explicitly says it was never designed and five rule-breakers is
five separate systems.

---

## Step 9 — The visual layer

**Adds:** the game stops being buttons and text. Sprites, animations, floating damage numbers,
sound — bolted onto an engine (Step 0-8) that has been emitting `events` since Step 1.

**Decide first:**
- **Lock the PixiJS decision now** (deferred from Step 0). Rendering has been an isolated module
  reading `state`/`events` since the beginning, so this is "write the PixiJS renderer" not
  "refactor to allow one" — but confirm before starting, since PixiJS's container/sprite model may
  want `core/state.ts` to expose position/animation-state fields it hasn't needed until now (e.g.
  which sprite frame is "in combat" vs "idle").

**Skip:** don't wait for every system (Steps 10-13) to exist before doing this. The brief's
sequencing principle is "one dimension at a time," and visuals are their own dimension — doing them
mid-roadmap against a 6-system-deep engine is fine, and arguably better than bolting them onto v1
at the very end.

---

## Step 10 — Real multiplayer (Colyseus)

**Adds:** the payoff for Step 0's room-shaped architecture — swap the single-player server loop
(Step 4) for an actual Colyseus room.

- `core/state.ts` becomes (or is wrapped by) a Colyseus `Schema`. `core/simulate.ts` and
  `core/commands.ts` don't change shape — a room's `update()` calls `simulate`, a room's
  `onMessage` calls `applyCommand`, same as the plain server did in Step 4.
- This step is the actual test of whether Step 0's boundary was drawn correctly. If it was, this is
  "swap the transport," not "rewrite the game."

**Decide first:**
- **Confirm Colyseus is still the right call** (deferred from Step 0) — by now there's a real
  server (Step 4) and real content depth (Steps 5-8) to judge it against, which wasn't true at
  Step 0.
- **What multiplayer actually means for this game** — shared zones, parties, or just "the same
  account-server-auth model, still solo play, now horizontally scalable"? `vision.md` explicitly
  lists PvP/chat/guilds/trading as *not wanted so far* — Step 10 doesn't have to mean social
  features, and shouldn't default into them.

**Skip:** don't build social features here just because the transport now supports them. Step 10 is
an infrastructure swap, not a scope expansion — matching `vision.md`'s standing "explicitly not
wanted" list.

---

## Step 11 — Death, de-leveling, and the login summary

**Adds:** stakes, and the screen that sells them. Both from `vision.md`, built together because the
summary screen exists largely to *show* de-levels.

- Death costs a % of gold/XP; enough XP loss de-levels and takes the talent point. Gear never lost.
  Per-account Stop-or-Retry setting, no guard rail.
- Login summary: time away, kills, deaths, XP, gold, drops — de-levels shown loudly and first, rare
  drops given disproportionate fanfare.

**Decide first:**
- **Does death-while-offline need its own formula, or does it fall out of the existing `simulate`
  rate function?** If defense (Step 7) already makes damage-to-player rate-based, offline death can
  stay closed-form (same reasoning as Step 2). If death depends on run-internal structure (bad
  luck streaks, specific monster attacks), that's actually Step 12's problem, not this step's —
  don't let waves/timers sneak in early to make death "feel more real."

---

## Step 12 — Waves, bosses, and timers

**Adds:** internal run structure — `wave 1 → … → wave N → BOSS`, two timers, boss as the only
top-tier gear source. Placed deliberately last among the mechanical systems.

**Decide first — `vision.md` already flags this as the single biggest architectural risk in the
whole roadmap:**
- **This breaks closed-form offline progress.** Every step through Step 11 kept `simulate`'s
  offline path and live-tick path as literally the same function call at different `elapsed`
  values. A run with internal structure (waves, a boss, a timeout penalty) makes the *rate*
  non-constant, and offline catch-up needs a real resolver that reproduces what would have
  happened tick-by-tick — plus a parity test proving the offline resolver and the live tick agree.
  Write this resolver design down before writing the wave/boss code, not after — this is exactly
  the kind of decision the doc policy calls "expensive to change later."
- **Per-monster attack data, if monsters get individual attacks** (not just a wave-clear timer):
  `vision.md`'s existing answer — a tiny data record per monster (`{element, min, max, chance,
  interval}`), one independent probability roll per tick, no state machine. Adopt this as-is; it
  was already designed correctly, just never built.

---

## Step 13 — Uniques, sets, and rule-breakers

**Adds:** the gear that makes zone choice a chase rather than a ladder — one Unique per boss, drop
only, roughly Perfect stats plus one rule that changes how a build works.

**Decide first:**
- **A bespoke-effect hook into the stat resolver / combat pipeline.** `vision.md` is explicit that
  this was cut *because* it was never designed as a system — each rule-breaker (a 2H weapon that
  still allows a shield, a shield that converts defense to attack) is its own mechanic. Before
  building a second Unique, decide the shape of "an item can override or hook a resolver step,"
  not just "an item has bigger numbers." Building one Unique as a one-off special case is fine;
  building a second one without this decision made means two special cases that don't compose.
- **Set items** ride on the same equip/inventory model from Step 6 — no new architectural decision,
  but confirm set-bonus checking (all N pieces equipped) is a derived read over existing state, not
  new state to keep in sync.

---

## Step 14 — Classes and specializations

**Adds:** the second class, and specialization branches (per `vision.md`: 3 branches per class,
mixable or maxable). Placed last among content-scale steps because it's the one most likely to
reveal that an earlier data model was quietly class-specific when it shouldn't have been.

**Decide first:**
- **Skill/ability data model: data-driven or code-per-class?** This is the step where "one class"
  assumptions baked into `core/simulate.ts` (if any crept in despite Step 0's intent) get found.
  Decide whether abilities are declarative data (preferred, keeps adding a class a content
  exercise) or per-class code before writing the second class, not after — this is the same
  "expensive to change later" category as the Step 6 item-schema decision.
- **Onboarding** (`vision.md`: pick a class → tutorial run → guaranteed weapon drop) is worth
  rebuilding here specifically because it's the first point where "which class" is a real choice.

**Skip:** don't try to make all 3×N specialization branches at once. One class fully realized with
its first specialization branch is more useful signal than three classes sketched at one branch
each.

---

## Step 15 — Refinement and respec

**Adds:** the late-game gold sinks — small permanent power steps paid in gold (refinement),
competing with respec for the same pool.

**Decide first:** nothing architectural. This is deliberately placed last among the economy systems
because it's pure content/balance work once gear (Step 6), tiers (Step 8), and talents (Step 5)
already exist — `vision.md` even leaves it explicitly open (max level, fail/downgrade risk, gold
vs. gold+material). Answer those by playing, same as the zone-2-timing question in `design.md`.

---

## What "v1" means here

v1 is every step above landed: one server-authoritative, multiplayer-capable engine; multiple
zones with a real wall; gear with tiers, sets, and Uniques; talents; defense and death; waves and
bosses; multiple classes with specializations; a visual layer; and the login summary as the
payoff screen. Nothing on this list is a rewrite of an earlier step — that's the property this
roadmap was built to protect, checked at Step 4 (server swap) and Step 10 (Colyseus swap), the two
points most likely to expose a boundary that didn't hold.

Anything not on this list — PvP, chat, guilds, trading, crafting, prestige loops, achievements,
daily quests — stays in `vision.md`'s "explicitly not wanted, so far" section. Adding a step for
one of them means writing down why it's now wanted, not just that it's common in the genre.
