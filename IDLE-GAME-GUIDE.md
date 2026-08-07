# Building My Own Idle RPG — Research & Build Guide

A personal notebook. Not a plan I'm committed to. The point is to collect knowledge now so that
when I actually start, I'm not researching and building at the same time.

**Decisions already made** (these shape everything below):

| Question | Answer | Why it matters |
| --- | --- | --- |
| Who owns game state? | **The server.** | Needs accounts, auth, and a rule that the client never decides outcomes. |
| Stack | **Reuse this repo's** — NestJS + Drizzle + Postgres + React/Vite/Tanstack | Familiar. Trade-offs still written down so I can change my mind on purpose, not by accident. |
| Ambition | **Learning project.** Decide later if it goes public. | Build the thing that teaches me the most. Flag anything that would lock a door. |
| When does the world advance? | **Lazy catch-up.** Compute elapsed progress when the player connects. | Cheap, serverless-friendly. Forces offline combat to be a *formula*, not a replay. |
| What does the player command? | **One hero, resolver written generic over N actors.** | Simple now, party later without a rewrite. |

**Two phases, on purpose:**

- **Phase 1 — the engine.** No graphics. Numbers, rules, database, API, deploy. The game is
  playable through plain HTML buttons and text. If it isn't fun as a spreadsheet, art won't save it.
- **Phase 2 — the visuals.** Sprites, animation, effects. Bolted onto a finished engine that
  already emits every event the visuals need.

Anything I catch myself wanting to do in Phase 2 while still in Phase 1 goes in the parking lot at
the bottom.

---

# Phase 1 — The Engine

## 1.1 Decide the game before writing code

The hardest part isn't code. It's knowing what the numbers do. Write this down first, in a plain
markdown file, before any TypeScript.

**The core loop.** One sentence. Something like: *"Pick a hunting ground, your hero fights it over
time, you get XP and loot, you spend loot on gear, stronger gear unlocks harder hunting grounds."*
If I can't write it in one sentence, I don't understand it yet.

**The progression spine.** What number goes up, and what does it unlock?

- Levels? Gear tiers? Both?
- What's the *wall* — the moment you can't progress and must change something? Idle games live and
  die on this. No wall = no decisions = boring.

**The decisions the player makes.** An idle game where you press "start" and wait is not a game.
Real choices, off the top of my head:

- Which hunting ground (risk vs reward — faster XP but you might die and lose the run)
- Which gear to equip (trade-offs, not strict upgrades — more damage, less survivability)
- Which talents to spend points on (irreversible or expensive to undo)
- What to craft or upgrade with limited materials

**Sources for how this is done well.** I have an unfair advantage here:
`docs/knowledge-base/wiki/` in this repo is a reverse-engineered spec of a working idle RPG —
rarity tiers, talent trees, imbuements, spells, equipment, hunts. It's a *reference for shapes*, not
something to copy. Read it and ask "why did they make it work this way", then design my own.

> **Legal note to self:** design patterns, math shapes, and genre conventions are free to learn
> from. Names, sprites, item lists, exact numbers, and lore are not. Everything I ship must be
> mine — my classes, my items, my art. That was the whole point.

**My notes:**

```
(the core loop, in one sentence)

(what the walls are)

(the decisions the player makes)
```

## 1.2 The math (do this on paper first)

Idle games are economies. Get this wrong and no amount of good code helps.

**Exponential costs, linear-ish gains.** The classic shape: each upgrade costs ~1.07–1.15× the
previous one. Player power grows, but so does the cost, so progress *feels* steady while the
absolute numbers explode. That ratio is the single most important number in the whole game.

**Time-to-next-thing is the real currency.** The question isn't "how much damage does this sword
do", it's "how many minutes until the next thing happens". Early game: seconds. Mid game: minutes.
Late game: hours. If the gap between rewards ever gets boring, players leave.

**Build a balance spreadsheet before the code.** Columns: level, XP needed, time to earn it, gold
per hour, cost of the next upgrade. Play the whole game in a spreadsheet. It takes an afternoon and
saves months.

**Things to research:**

- [ ] Exponential vs. polynomial cost curves — when each feels right
- [ ] "Prestige" / reset loops — do I want one? (Reset progress for a permanent multiplier. It's
      how idle games get long lifespans out of little content.)
- [ ] Soft caps and diminishing returns — how to stop one stat dominating
- [ ] How to keep numbers inside `Number.MAX_SAFE_INTEGER`, or when to reach for BigInt / a
      "big number" library (idle games hit this genuinely fast)

## 1.3 The rule that makes server-authoritative work

**The client never computes anything that matters.** It sends *intent* ("equip item 42",
"start hunt 3"), the server decides what happened, and the client renders the answer.

Practical consequences, all of which I need to design for from day one:

- Every action is a use case on the API. There is no "the frontend applies the damage".
- The client's copy of state is a **cache**, not the truth. Tanstack Query is already the right
  tool for that.
- Time is decided by the server clock. Never `Date.now()` from the browser, ever. That's the #1
  idle-game cheat: change your system clock, get 10 years of progress.

### The catch-up calculation

This is the heart of a lazy-tick idle game and it deserves its own careful design.

```
player connects
  → server reads last_simulated_at
  → elapsed = now - last_simulated_at
  → simulate(state, elapsed) → new state + a summary of what happened
  → save, set last_simulated_at = now
  → return the new state and the summary to the client
```

Things that make this hard, and that I should decide up front:

- **Offline combat must be closed-form.** I can't loop 8 hours of individual attacks — that's
  millions of iterations per login. Instead: "kills per hour × hours = kills", then roll loot.
  So my combat needs a *rate* representation, not just a step-by-step one.
- **That means two combat modes.** A per-tick resolver (for live play, which produces the events
  Phase 2 will animate) and a rate resolver (for offline). **They must agree.** If online play is
  measurably better than offline, players will never close the tab, and that's a bad game.
  → *Test idea: run the tick resolver for a simulated hour, run the rate resolver for an hour,
  assert the outcomes are statistically the same. This is a great regression test.*
- **Cap the offline window.** 8 or 24 hours max. Otherwise someone comes back after a year and
  breaks the economy.
- **Randomness must be reproducible.** Use a seeded PRNG stored on the player's state, not
  `Math.random()`. Then a run can be replayed, debugged, and verified. Non-negotiable if I ever
  want to prove a result wasn't a bug.

**My notes:**

```
(how does combat produce a "kills per hour" number?)

(what's the offline cap?)
```

## 1.4 Code architecture

Reusing what already works in `packages/api`. The layering rules in
[docs/architecture-api.md](docs/architecture-api.md) apply as-is.

### The one big new idea: **content is data, not code**

This is the single most important architectural decision in a game, and it's the one most people
get wrong. Every item, monster, spell, hunting ground, and talent is a **row or a JSON file**, not
a TypeScript class.

Bad:

```ts
class FireSword extends Weapon { damage = 40; }
```

Good:

```json
{ "id": "ember-blade", "slot": "weapon", "tier": 3, "stats": { "attack": 40, "fireDamage": 12 } }
```

Why this matters more than it looks:

- I can add 50 items without touching code or redeploying.
- Balance changes become data edits, not commits.
- A designer (me, on a Sunday) can work without opening an IDE.
- Phase 2 gets easy: each item just gains a `"sprite": "ember-blade.png"` field.

So: a **content layer**. Static definitions loaded at boot (or seeded into Postgres), separate from
player state. Player state references content by ID.

- [ ] Research: JSON files in the repo vs. content tables in Postgres vs. a hybrid.
      *Leaning: JSON in the repo, validated with Zod at boot, seeded into Postgres for joins.
      Content is versioned with the code, which matters when a balance change would break saves.*

### Patterns actually worth knowing for games

Not the whole GoF book — these specifically:

| Pattern | What it buys me here |
| --- | --- |
| **Entity-Component** (light version) | An item is a bag of stat modifiers, not a class hierarchy. Avoids the `FlamingSwordOfIce extends…` disaster. |
| **State machine** | A hunt run is `idle → fighting → looting → done/dead`. Explicit states kill a whole class of bug. |
| **Event sourcing (lightly)** | Combat emits events (`AttackLanded`, `LootDropped`). Phase 2 animates them. I've already seen this shape in this repo's `fx-event.entity.ts`. |
| **Command pattern** | Every player action is a named command with a validated payload. Maps 1:1 to use cases. |
| **Strategy** | Different damage formulas per damage type, picked by data, not `if/else`. |

Explicitly **not** doing: ports/adapters, a shared "engine" package, an abstract `IGameRule`
interface. Indirection whose only payoff is testability isn't worth it here.

### Where the engine actually lives

Keep the simulation as **pure functions in the domain layer**: `simulate(state, elapsed, content)
→ { newState, events }`. No database, no Nest, no I/O. Then:

- It's trivially unit-testable. Thousands of simulated hours in a second.
- It could later run in the browser too, for optimistic prediction in Phase 2, from the *same*
  source.
- **This is the highest-value part of the whole codebase.** Treat it accordingly.

### Save format & migrations — the thing that will bite me

Player state is a long-lived data structure that I will want to change constantly.

- [ ] Version every save (`schemaVersion: 3`) and write forward-migrations from day one.
- [ ] Decide: player state as **normalized SQL tables** (queryable, joins, harder to evolve) vs.
      a **JSONB blob** (flexible, fast to iterate, unqueryable). *Leaning: hybrid — identity,
      currencies and level as real columns; inventory and progress flags as JSONB. Revisit once I
      know what I need to query.*
- [ ] Never delete a content ID once it's live. Retire it, keep the row. Old saves reference it.

### Testing

The API side already has patterns worth reusing (`/api-test`). Game-specific additions:

- **Balance tests.** "A fresh account reaches level 10 in between 20 and 40 minutes of play."
  These break when I change numbers — which is the point. They're my early-warning system.
- **Determinism tests.** Same seed + same input = same output, always.
- **Parity tests.** Online tick resolver vs. offline rate resolver agree (see 1.3).
- **Property tests.** "No sequence of valid actions ever produces negative gold." Worth learning
  fast-check for this; economies fail in ways example-based tests don't catch.

## 1.5 Infrastructure

Learning project, so: cheapest thing that teaches me something real, with no door closed.

### Hosting

| Option | Good | Bad |
| --- | --- | --- |
| **SST / Lambda** (what this repo uses) | Near-zero cost when idle. Already know it. Fits lazy-tick perfectly — no always-on process needed. | Cold starts. No background loop, ever. If I later want live ticking, I need something else. |
| **A single small VPS** (Hetzner/DigitalOcean, ~$5/mo) | Dead simple. Always-on, so websockets and live ticks are possible. One box to reason about. | I own patching, backups, uptime. |
| **Fly.io / Railway / Render** | Middle ground. Container, always-on, managed. | Costs money while idle. |

*Leaning: start on Lambda since it's already wired and lazy-tick doesn't need a loop. Keep the
"could I move to a VPS in a weekend" property — meaning no deep Lambda-specific coupling.*

### Database

Postgres, managed. **Neon** or **Supabase** free tier for a learning project — both scale to zero.
Local dev in Docker Compose, same as now.

- [ ] Backups from day one. Players losing progress is the one unforgivable bug. Automated daily
      dump + a restore I've actually tested. Untested backups aren't backups.

### Assets (matters in Phase 2, decide in Phase 1)

Sprites go on object storage (S3/R2) behind a CDN, never in the API bundle. Cloudflare R2 has no
egress fees, which is the right call for image-heavy stuff. Design the content JSON so a sprite is
just a filename — then the CDN URL is a config value.

### Observability

- [ ] Structured logging (this repo's rule #6 already covers it — `new Logger(X.name)`, structured
      context, no `console.*`).
- [ ] Error tracking: Sentry free tier.
- [ ] One dashboard of game health: active players, average session, where players stop playing.
      **That last one is the most valuable number in the entire project.** It tells me where the
      game is boring.

## 1.6 Security (server-authoritative changes the threat model)

Idle games are unusually cheat-prone because *time* is the currency and time is easy to lie about.

**The essentials:**

- [ ] **Auth.** Don't build it. Use a provider (Clerk, Supabase Auth, Auth0, or Lucia if I want to
      learn the mechanics). Sessions/JWT, refresh tokens, the usual.
- [ ] **Server clock only.** Repeating it because it's the #1 cheat vector.
- [ ] **Validate every input at the boundary.** Zod/class-validator on every DTO. Never trust an
      item ID, a quantity, or an index from the client.
- [ ] **Rate limit everything.** Especially the catch-up endpoint — otherwise someone calls it in a
      loop. (Design it so calling it twice in a row is a no-op: elapsed time is zero. Idempotence
      beats rate-limiting.)
- [ ] **Ownership checks on every action.** "Equip item 42" must verify item 42 belongs to *this*
      player. The single most common vulnerability in game APIs.
- [ ] **Race conditions.** Two simultaneous requests both spending the same gold. Needs row-level
      locking or optimistic concurrency (a `version` column). Genuinely easy to get wrong and it
      duplicates items — the classic MMO economy-killer.
- [ ] **Never send secrets to the client.** Loot tables, drop rates, formulas — if the client
      doesn't need it to render, don't send it.

**Deferred until it's actually public:** account recovery, GDPR/data deletion, moderation for any
player-visible text (names, chat), abuse reporting, ToS/privacy policy. Note them so future-me
isn't surprised.

## 1.7 What "done with Phase 1" looks like

A checklist to stop me drifting into art too early:

- [ ] I can register, log in, and my hero persists
- [ ] I can start a hunt, close the tab, come back hours later and get correct offline progress
- [ ] Loot drops, goes into an inventory, and can be equipped
- [ ] Equipping changes combat outcomes in a way I can see in the numbers
- [ ] There's at least one real decision with a trade-off
- [ ] There's a wall that requires me to change my build to pass
- [ ] The whole thing is playable through ugly HTML buttons — **and I still want to keep playing**
- [ ] Combat emits a stream of events, even though nothing renders them yet

That last one is the bridge to Phase 2. Build it in Phase 1 or pay for it later.

---

# Phase 2 — Visual Feedback

Only start this when Phase 1's checklist is green.

## 2.1 What I actually need (and don't)

Established earlier and worth restating, because it's the thing that makes this achievable:

| Thing | Needed? | Why |
| --- | --- | --- |
| **Sprites** | Yes | Characters, monsters, item icons, spell effects. |
| **Animation** | Yes, simple | Short looping frame sequences. Idle, attack, hit, die. |
| **Particle / FX layer** | Yes | The "juice" — damage numbers, flashes, screen shake. Cheap, huge impact. |
| **Tilemap** | Barely | A static background per hunting ground. Fixed slots for actors. |
| **Collision detection** | **No** | Nothing collides. The server said "hit"; I play the hit animation. No hitboxes, no physics. |
| **Pathfinding** | **No** | Nobody walks anywhere. A walk cycle on a scrolling background goes nowhere by design. |
| **Physics engine** | **No** | Not that kind of game. |

**The two-layer architecture:**

1. **DOM/React layer** — everything the player configures. Inventory, gear, talents, hunt
   selection, shop. This is ordinary web dev. Drag-and-drop loot is `dnd-kit`, not a game engine.
2. **Canvas viewport** — a small window that just *shows* the fight. Reads the event stream from
   the server and plays animations.

Only layer 2 needs a renderer, and its whole job is `on CastEvent → play spell sprite at slot N`.
That's a few hundred lines, not a game engine.

## 2.2 Rendering — what to research

- [ ] **PixiJS** — a 2D renderer, nothing more. Sprites, animation, filters, fast. Probably the
      right call: I don't need scenes, physics, or input handling from an engine.
- [ ] **Phaser** — a full game framework. More batteries (scenes, tweens, audio, input), more
      opinions, heavier. Fine, but I'd use maybe 20% of it.
- [ ] **Plain CSS + DOM** — genuinely viable for a slow-paced idle game with a dozen sprites on
      screen. Zero new dependencies, animate with CSS transitions. **Seriously consider starting
      here** and only reaching for Pixi when it visibly can't keep up.
- [ ] How to embed a canvas renderer inside React without the two fighting over the DOM (the
      renderer owns its `<div>`; React never touches inside it).

## 2.3 Art — the real bottleneck

Not code. Art. Be honest about it.

**Options, roughly in order of how much I'd rely on each:**

- **Asset packs.** itch.io, Kenney.nl (free, CC0), OpenGameArt. Check the licence *every time* —
  and whether the art is genuinely free to use commercially if this ever goes public.
- **Commission an artist.** Fiverr, itch.io forums, Reddit. Costs real money, gets a coherent look.
- **Make it myself.** Aseprite (~$20) is the standard pixel-art tool. Genuinely learnable for
  simple icons and 4-frame loops. Weeks, not years, for the level I need.
- **AI generation.** Fine for concepts and item icons; struggles badly with consistent character
  sprite sheets across frames. Also worth thinking about how I'd feel shipping it.

**The constraint that saves me:** pick a small, forgiving art style *first* and never deviate.
32×32 pixel art with an 8-colour palette, or flat vector icons. A consistent limited style looks
intentional; an inconsistent good style looks broken.

- [ ] Research: what makes a sprite sheet, how frame-based animation is structured, texture atlases
      and why they matter for performance.

## 2.4 Game feel ("juice")

The gap between "functional" and "fun" is mostly cheap tricks:

- Floating damage numbers that drift up and fade
- A brief flash/tint when something takes a hit
- Small screen shake on big hits
- Easing on every bar and counter — never snap a number, animate to it
- A sound per meaningful event (hit, level up, rare drop)
- Rare drops deserve *disproportionate* fanfare. That moment is why people keep playing.

Cheap to build, and it's most of the perceived quality. Worth a dedicated research pass —
searching "game juice" turns up a lot.

## 2.5 Audio

Easy to forget, punches above its weight.

- [ ] Sources: freesound.org, Kenney's audio packs, itch.io
- [ ] Howler.js, or the plain Web Audio API
- [ ] Mute button on day one. Autoplay is hostile, and browsers block it anyway.

---

# Things I'd otherwise miss

Collected here rather than forced into a phase.

**Scope.** The single biggest killer of hobby games. Write down what the game is **not**. No PvP,
no chat, no guilds, no trading, no crafting — until the core loop is proven fun. Every one of those
is a whole project.

**Playtesting.** I'm the worst possible judge of my own game — I know all the numbers. Get three
people to play it and *watch without helping*. Where they get confused is the actual bug list.

**Onboarding.** The first 60 seconds decide everything. Players won't read. The first choice should
be obvious and rewarding, and the second should already feel like a real decision.

**Save-wipe policy.** During development I'll break saves constantly. Decide now: dev accounts are
wipeable, and the moment I let real people in, wipes stop. Say it out loud to players.

**Content velocity.** An idle game is consumed far faster than it's built. Players will exhaust
weeks of my work in days. Design for content that *combines* (10 items × 10 monsters × 5 zones)
rather than content that's authored one piece at a time.

**Naming and identity.** The game needs a name, and ideally I check it isn't taken before it's in
50 files and a domain name.

**Keeping a devlog.** For a learning project, the learning *is* the output. A dated file of what I
tried and what broke is worth more later than the code.

**Cost ceiling.** Set a monthly number I'm willing to burn ($10?) and put billing alerts on
everything before the first deploy. Learning projects that quietly cost $200 stop being fun.

---

# Research queue

Ordered by when I'll need it, not by interest.

**Before writing code:**
- [ ] Play three idle games properly and take notes on their loops and walls
- [ ] Read `docs/knowledge-base/wiki/` in this repo end-to-end, asking "why this shape?"
- [ ] Build the balance spreadsheet
- [ ] Write the one-sentence core loop

**Phase 1:**
- [ ] Cost curves and idle-game economy math
- [ ] Seeded PRNG in TypeScript
- [ ] Save versioning and migration strategies
- [ ] JSONB vs. normalized player state in Postgres
- [ ] Optimistic concurrency in Drizzle (row versions / `SELECT … FOR UPDATE`)
- [ ] Auth provider comparison
- [ ] fast-check (property-based testing)

**Phase 2:**
- [ ] PixiJS basics; PixiJS-inside-React integration
- [ ] Sprite sheets, frame animation, texture atlases
- [ ] Aseprite fundamentals
- [ ] Game juice techniques
- [ ] Asset licences (CC0 vs CC-BY vs commercial-use)

---

# Parking lot

Ideas that arrive at the wrong time. Write them here, don't build them.

```
(idea)                                                          (date)
```

---

# My own notes

## Attributes


## Items
### Context
- Item aesthetic will be based on "MuOnline"
- Items should be displayed on the character
- Items should have a "glow" do clearly state that it's powerful
      - Item glow will increase according to refinement level

### Tiers
1. Normal
2. Superior
3. Perfect
4. Unique
5. 

1. Not all items will be class specific
1.1. Set items 
- Support unique items that are build defining
- Create set items that together can be optimal for a specific goal 

## Classes
1. Every class in the game will have 3 specialization branches
1.1. It should be possible to mix all specialization branches for hybrid composition
1.2. It should be possible to maximize one specialization branch
1.3. [NOT DEFINED] Every class should be able to perform a tank role

### Druid
- Wyd inspiration (Beast Master | Shapeshifter | Elementalist)

#### Beast Master
- Summon packs of monsters and rely on them to do damage
- Rely on "tanky" shape shifting skills to handle damage

#### Shapeshifter


#### Elementalist


### 