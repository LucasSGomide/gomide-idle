# 01 — How Baiak Idle actually works

**Verdict:** researched, nothing committed to · **Verified:** 2026-08-11 against the live site,
the game bundle `index-CBHS77YQ.js` (3.47 MB) and `/api/things/manifest.json` · **Read-only**:
public static assets and unauthenticated endpoints only. No token used, no authenticated call
replayed, no frame sent.

> This document answers three questions — how Baiak Idle leverages Tibia, what it's built on, and
> what I'd have to learn to build something like it. It is **research, not a plan.** Nothing here
> is scheduled and nothing here amends [`design.md`](../design.md). The last section is the one
> that matters: *most of this must not be imported into 0.1.0.*

**Companion repo:** much of what follows was already established in
`~/dev/personal/tibia-idle/docs/`, which is a two-month reverse-engineering effort against this
exact game. Where a finding came from there it is cited. Where I verified something new on
2026-08-11 it is marked **[new]**. That repo is the single most valuable asset I have for this
project, and §6 is about how to spend it.

---

## The one-paragraph answer

Baiak Idle is **an Open Tibia server's content and rules, re-hosted on a modern web stack, with the
map deleted.** It did not redraw Tibia's art, did not re-derive Tibia's monster stats, and did not
reinvent Tibia's vocabulary — it imported all three wholesale and keyed them by Tibia's own numeric
ids. What it *did* build is the part that makes it a game rather than an emulator: a spawn queue in
place of a world, a rotation/helper automation layer in place of a player's hands, and a
progression economy (tiers, rarities, talents, imbuements, forge, prey) that is genuinely its own
design. The reason one small team can ship a game with 276 monsters and 9,760 items is that
**roughly 80% of its content is an import and roughly 100% of its hard engine problems were deleted
rather than solved.**

---

## 1. How it leverages Tibia — three separate borrowings

These are worth keeping distinct, because they carry very different costs, risks and lessons.

### 1.1 Art assets — Tibia client sprites, keyed by Tibia's own ids **[new]**

`https://baiakidle.com/api/things/manifest.json` is public (200 with no `Authorization`,
`cache-control: public, max-age=21600`, and a bespoke `x-things-cache: HIT` header — it's a
separate asset service, not the app).

| Key | Count | Shape |
| --- | ---: | --- |
| `monsters` | 368 | `{file, frameW, frameH, directions, frames, walkStart, durations, mask?}` |
| `items` | 1,383 | name → `object/<id>.png?v=4` |
| `effects` | 100 | `{file, frameW:32, frameH:32, frames, durations}` |
| `missiles` | 46 | `{file, frameW, frameH, pw:3, ph:3}` |
| `floor` | 1 | the single ground tile |

**The ids are Tibia's, and this is provable by joining two sources that were never meant to
agree.** I checked both joins directly:

- **Monsters:** `data/monsters.json` carries a `lookType` per monster; the manifest serves
  `outfit/<n>.png`. **272 of 276 match exactly.** The 4 exceptions are monsters with `lookType: 0`
  served from `object/*.png` instead — which is precisely Tibia's `lookTypeEx`, the mechanism for a
  creature that *is* an item sprite (`brain_head`, `bonelords_phylactery`).
- **Items:** the bundle embeds its own `name → {id: n}` table (7,945 entries). Of the 762 names that
  join against the manifest, **759 use that id as the sprite filename.** The three exceptions are
  two trophies and an off-by-one pearl.

So: `cyclops → outfit/22.png`, `dragon → outfit/34.png`, `troll → outfit/15.png`,
`mana potion → object/268.png`, `fire sword → object/3280.png`. Those are Tibia outfit and item
ids, not arbitrary keys.

Three more details that pin the provenance beyond doubt:

- **Missiles carry `pw: 3, ph: 3`** — a 3×3 pattern grid. That is Tibia's asset format for a
  directional projectile: 8 compass directions plus centre, laid out as a pattern rather than as
  frames.
- **Monster sheets are `frames: 9, directions: 4, walkStart: 1`** — one idle frame followed by an
  8-frame walk cycle, per direction. Tibia's outfit animation layout exactly.
- **100 of 276 monsters ship a `_mask.png`**, composited against `{head, body, legs, feet}` colours
  from live creature state. That is Tibia's outfit colourisation system, reimplemented faithfully
  enough to need the mask channel.

The item ids reach into the 47,000s and 52,000s (`pixie soul core: 47861`), so the extraction was
done from a **recent** Tibia client, not a legacy 7.x/8.x one.

**What this actually is:** a Tibia client asset dump, re-exported into per-object PNG sheets and
published behind a name-keyed manifest. It is not inspiration, homage or pixel-art in Tibia's style.

### 1.2 Game data — Open Tibia server definitions, transliterated to JSON

The monster schema is a **TFS/OTServ `monster.xml` in JSON clothing**, field for field:

```json
"dragon": {
  "hp": 1000, "exp": 700, "lookType": 34, "armor": 25, "speed": 26,
  "dmg": [0, 120],
  "resist": { "earth": 80, "energy": 20, "ice": -10, "fire": 0, ... },
  "abilities": [
    { "element":"fire", "min":60,  "max":140, "chance":15, "interval":2000,
      "radius":4, "target":true, "range":7, "effect":7, "missile":4 },
    { "element":"fire", "min":100, "max":170, "chance":10, "interval":2000,
      "length":8, "spread":3, "target":false, "effect":7 },
    { "element":"healing", "min":40, "max":70, "chance":15, "interval":2000,
      "target":false, "effect":13 }
  ],
  "loot": [ { "name":"gold coin", "chance":89920, "max":102 }, ... ]
}
```

Every field maps to a TFS concept: `dmg` is the melee min/max, `abilities[]` is the `<attacks>`
node (`interval`/`chance` per attack, `radius` for a ball, `length`+`spread` for a wave/beam,
`target` for targeted vs self-centred, `effect`/`missile` as the magic-effect and shoot-effect ids),
and `loot.chance` is out of 100,000 — gold coin at 89920 is an 89.92% drop. Spells are Tibia's
literal incantations with Tibia's levels and mana costs (`exura` 8/20, `exura sio` 18/120), and
items carry Tibia's `atk`/`def`/`wandMin`/`wandMax`/vocation gates.

The game's name says it out loud: **"Baiak" is the name of a well-known Brazilian Open Tibia
server map.** The lineage is declared, not hidden.

### 1.3 Systems vocabulary — and where it deliberately stops

Imported: vocations, imbuements, prey, forge, bestiary/bosstiary, Cyclopedia, the resistance model,
the elemental wheel, party composition.

The resistance law is **proven exactly**, not assumed —
`dealt = floor(base × (1 − resist/100))`, measured across 7,179 recorded hits, with a 90%-resist
monster collapsing onto the same normalised range as a 0%-resist one to within 0.7%. Negative
resistance amplifies and is never clamped. (`tibia-idle/docs/explorations/07-damage-formula.md`.)

**Not** imported, and this is the interesting half — these are Baiak Idle's own design:

- a rarity/tier system with 32 rolled attributes on gear
- a talent tree with ANY-of prerequisites
- 4-slot rotation bars with per-spell mob-count thresholds
- the **helper**: heal thresholds, magic-shield modes, target modes, auto-equip, potion automation
- arena (ranked 3v3), guild wars, market, auction, a coin economy with real-money top-up

That split is the actual lesson: **it inherited a world and invented an economy.** The inherited
part is what made it feasible; the invented part is what makes it a game people play.

### 1.4 The architectural move that makes all of it work: they deleted the map

Tibia's genuinely hard engine problems — tile grid, pathfinding, line of sight, walking, stacking,
containers, visibility — are **absent**. A hunt is three numbers:

```json
{ "id": "troll-cave", "minLevel": 1, "monsters": ["troll","swamp_troll"],
  "maxAlive": 4, "spawnMs": 2200 }
```

A spawn queue with a concurrency cap and a respawn interval. That's the whole world model. All 60
hunts share `maxAlive: 4` and nearly all share `spawnMs: 2200`.

This is the single most transferable idea in the document, and it's the same idea already sitting
in [`build-guide.md`](../research/build-guide.md) §2.1 under "no collision, no pathfinding, no
physics" — here is a shipped, commercial-scale proof of it.

### 1.5 Monster AI vs. player AI — two different things wearing the same word

This needed a second pass. The monster side and the player side turned out to be answered by
completely different evidence, and they must not be blurred together.

**Monsters have no AI — they have a stat block plus a coin flip.** This part *is* fully visible in
the client bundle, because monster definitions are static content compiled into it. A monster is:

1. a stat block (`hp`, `armor`, `resist`, `exp`),
2. a melee attack rolling `dmg[min..max]` on a fixed cadence,
3. a list of abilities, each an **independent Bernoulli trial every `interval` ms at `chance` %**,
4. a targeting *shape* per ability (single-target / `radius` ball / `length`+`spread` beam).

The dragon in §1.2 is three coins flipped every 2 seconds at 15%, 10% and 15%, one of which heals
it. That is a timer wheel, perhaps fifty lines of server code, and there is nothing hiding behind
it — no pathing, no aggro table, no decision-making. Monster *movement* (walking toward a melee
target, ranged monsters trying to keep their `range`) is server-side logic the client never
receives, so I can't inspect it directly — but it doesn't need to be clever, because the map is a
single small room per hunt (§1.4), not open terrain to navigate.

**What you found is the other half: the *player's* auto-pilot has a named, statted AI, and
"Battle Tactics" upgrades it.** This is a genuinely different system and your question caught a gap
in my first pass. Found live in the bundle:

```js
function TY(level, tactics = 0) {
  const levelTier   = Math.floor(Math.max(0, level) / 100);
  const tacticsTier = Math.max(0, tactics);
  const tier = levelTier + tacticsTier;
  const qp   = Math.min(10, levelTier * 0.5) + Math.min(10, tacticsTier);
  return {
    tier,
    aimChance:        Math.min(1, 0.5 + 0.025 * qp),   // 50% floor, climbs toward 100%
    castSearchRadius: Math.min(1 + Math.floor(qp / 7), 3),
    repositionMinMs:  Math.max(4000, 5000 - 50 * qp),
    infiniteKite:     tier >= 3,
  };
}
```

The game's own tooltip (translated): *"Combat AI: the perfect behaviour (aim, positioning, kiting)
exists from level 1, and the % is the chance of nailing it on each decision — level provides half
the quality (up to 2000) and the Battle Tactics node the other half; tactics level 3 unlocks
infinite kite without a tank."*

So: your character is *always* auto-playing — walking to keep range, casting, repositioning to
dodge. `aimChance` is the probability that, on any given decision tick, the autopilot executes the
*optimal* version of that behaviour instead of a worse one. Level buys half of that probability
(capped), the `Battle Tactics` talent buys the other half, and at `tier ≥ 3` the character can kite
melee monsters forever without ever needing a tank to hold aggro. This is **not** monster
intelligence — it's a numeric knob on how good your own bot is at playing the game for you, spent
as a talent-tree choice instead of as a player skill.

**Why this distinction matters for you:** if `vision.md`'s combat ever needs "does my character
play well or badly", the honest, cheap version of that is exactly this — one probability, gated by
a stat, that decides whether a tick executes the good branch or a lesser one. It's a talent-tree
line item, not a pathing engine.

**Implication for monsters:** monster behaviour is a *data schema* decision, not an engine
decision. If combat ever enters this project, the ability schema in §1.2 is worth adopting on day
one — it costs nothing to store fields you don't yet read, and it's the difference between adding a
monster as a content edit and adding one as a code change.

---

## 2. The tech stack

All verified live on 2026-08-11 unless cited otherwise.

| Layer | What | How I know |
| --- | --- | --- |
| Edge / hosting | **Cloudflare** in front of everything | `server: cloudflare`, `cf-ray`, NEL reporting, HTTP/3 |
| Bot / signup gate | **Cloudflare Turnstile** | sitekey embedded in the bundle; login + registration are captcha-gated |
| Client shell | **Hand-written static HTML**, id-addressed HUD (`#hud-gold`, `#tab-forge`) | fetched `/jogar/` directly |
| Build | **Vite** | `<script type="module" src="/jogar/assets/index-<hash>.js">`, hashed CSS sibling |
| UI framework | **None.** Vanilla TS + DOM | 0 × `useState`, 0 × `React`, 2,439 × `document.createElement` |
| Fight viewport | **PixiJS v8** (WebGL/WebGPU) | `pixi.js/core`, `pixi.js/math`, `pixi.js/unsafe-eval`; deprecation strings spanning 8.0.0 → 8.8.0 |
| Account/meta API | **tRPC** over HTTPS, `/api/trpc/<router>.<proc>` | 14 routers, ~80 procedures; Bearer token from `localStorage['baiak-idle-token']`; plain JSON, no superjson |
| Gameplay server | **Colyseus** (WebSocket, `@colyseus/schema`) | rooms `chat`, `hunt`, `partyhunt`, `city`, `house`, `queue`, plus `arena` / `warzone` |
| Wire format | Colyseus protocol byte + **msgpack** payload; state via schema patches | `tibia-idle/tools/socket-capture/internals.md` |
| Assets | Separate name-keyed sprite service, 6h cache | `/api/things/manifest.json`, `x-things-cache` |
| Delivery | **PWA** — installable, versioned service worker | `manifest.webmanifest`, `pwa-20260806141428.js` |
| Locale | **pt-BR primary** | 53 × `pt-BR` vs 2 × `en-US` in the bundle |

Not observable from outside, and I'm not going to guess: the server language beyond "Node, because
Colyseus", the database, and the deployment topology. Cloudflare masks all of it.

### 2.1 The structural insight worth stealing: two backends, split by ownership

This is the part I'd actually copy.

```
tRPC  / HTTPS ──> transactional, account-shaped, request/response
                  characters, guild, market, auction, coins, prefs, donations

Colyseus / WS ──> real-time, simulated, stateful
                  hunting, combat, loot, forge, boss runs, arena
```

**During active hunting there are zero combat-related HTTP requests.** Every damage number arrives
over the socket. Combat is fully server-authoritative — the client bundle sums `critChance`,
`onslaught` and `execute` *for display* and never consumes them in a formula. The damage roll is
provably not in the client (`tibia-idle/docs/knowledge-base/wiki/09-api-trpc.md`, re-confirmed in
exploration 07).

There is no router for combat, hunts, monsters or items — deliberately. Static content is compiled
into the client, and the server resolves combat from the same definitions, so there is nothing
per-account to serve.

The sharding is visible too: socket paths are `/rt2-9/…`, `/rt3-6/…` (shard / processId / roomId),
and chat is sharded 16 ways by `characterId % 16`.

### 2.2 Balance knobs live outside the content

`adminConfig.monsterMult` is a **public, unauthenticated** endpoint returning live stat multipliers:

| | HP | Atk | Def | Exp |
| --- | ---: | ---: | ---: | ---: |
| monster | 200% | 200% | 150% | 100% |
| boss | 150% | 200% | 300% | 100% |
| stage boss | 300% | 200% | 300% | **200%** |

The bundle stores *base* stats; the server scales them at runtime. So every raw HP number in the
content data is half the truth on the live server.

**And the reason this matters for my own design is subtle and good:** because the multiplier is
uniform across regular monsters, it **reorders nothing** — every hunt ranking is unchanged by it.
What it changes is which *regime* you're in. That's a tuning dial that adjusts difficulty without
touching content or invalidating any balance work. See §6.

---

## 3. What I'd have to learn — and why, one topic at a time

For each topic below: **why bother, what it actually buys you in the game, and a concrete example.**
Ranked so the ones that matter most for 0.1.0 come first.

### Already true of your plan — this research just double-checks it, nothing to learn

- **PixiJS for the fight, plain HTML/DOM for everything else.** *Why:* a renderer like Pixi is built
  for one job — drawing lots of moving sprites fast. Buttons, inventory lists and menus don't need
  that; they're just DOM the browser already knows how to draw. *Example:* Baiak Idle's whole HUD
  (gold counter, tabs, talent tree) is plain `document.createElement` calls — zero React, zero
  framework. Only the little box where the fight happens is Pixi. `build-guide.md` §2.2 already
  guessed this was the right split; this is proof it works at commercial scale, not a new idea.
- **No collision, no pathfinding, no physics engine.** *Why:* those are the three hardest, most
  time-consuming systems in game dev, and an idle game doesn't need any of them if nothing actually
  moves around a map. *Example:* a Baiak Idle hunt is one room with up to 4 monsters in it — nobody
  walks anywhere real, so there's nothing to path around. §1.4 has the proof.
- **Content as data (JSON), not as code.** *Why:* it means adding a new monster or item is editing a
  file, not shipping new code. `design.md` already commits to this.
- **Server decides the truth, client just displays it.** *Why:* stops players from editing their own
  browser to give themselves free gold. Already decided for this project (2026-08-11).

### Worth actually learning, ranked by payoff

1. **Split your API into two kinds of calls: "account stuff" and "game stuff."** *Why:* they behave
   completely differently. Account stuff (create character, buy item) is a normal request: click,
   wait, get an answer. Game stuff (combat) needs to keep flowing without you clicking anything.
   Mixing them into one API makes both harder to reason about later. *Example:* Baiak Idle has zero
   HTTP requests while you're fighting — every damage number streams over a different connection
   entirely (§2.1). Your `design.md` is small enough that this is one file today, but naming the
   split now means the day you add anything continuous (a boss fight with a timer, live combat logs)
   you're extending a boundary instead of untangling one API that does two jobs. **Highest payoff for
   the least effort — this is a naming exercise, not a technology.**
2. **Design your content shapes (`zone`, `monster`, `item`) so a spreadsheet could fill them in.**
   *Why:* the moment you have 3 zones, you're fine. The moment you want 30, hand-tuning each one
   individually doesn't scale — you need fields that combine predictably instead of needing a bespoke
   decision each time. *Example:* every one of Baiak Idle's 60 hunts is the same 5 fields
   (`minLevel`, monster list, `maxAlive`, `spawnMs`) — that shape is why the game *has* 60 hunts and
   didn't need 60 custom implementations. Get `design.md`'s zone table into a shape like that before
   there are more than 3 rows.
3. **A "difficulty dial" that sits outside your content, not inside it.** *Why:* separates "the game
   is too easy" (turn a knob) from "the game needs new content" (add a zone). One is a config change,
   the other is a design project — you want to be able to do the first without touching the second.
   *Example:* Baiak Idle doubles every monster's HP and damage with one public config value
   (`adminConfig.monsterMult`) — the content file itself never changes. If your zone-2-takes-9-hours
   question (`design.md`'s one open item) turns out to be wrong for everyone, this is how you'd fix
   it without re-balancing three zones by hand.
4. **A sprite lookup table, fetched once, that degrades gracefully.** *Why:* the alternative — baking
   image paths into your code — means every new sprite is a code change, and a missing image crashes
   the page instead of just... not showing an image. *Example:* Baiak Idle fetches one JSON file
   mapping `"dragon" → sprite path`, caches it for 6 hours, and any name not in the list just renders
   nothing instead of breaking. Directly answers the open question in `build-guide.md` §2.3.
5. **How a sprite sheet actually works, mechanically.** *Why:* you'll need this the moment you have
   more than one animation frame, and it's genuinely simple once you see it done. *Example:* one PNG
   file laid out as a grid — walk frames going across, facing directions going down — and you show
   "frame 3, facing south" by moving a CSS crop window to that grid cell. No canvas math required for
   something this simple. §1.1 has the exact layout Baiak Idle uses as a spec to copy.
6. **Design so cheating buys nothing, instead of trying to detect cheating.** *Why:* catching bots is
   an arms race you can't win alone; removing the payoff for botting is a design decision you make
   once. *Example:* Baiak Idle's "sell all loot" button has a server-side cooldown — a script
   clicking it hits the exact same wall a human finger does, so there's nothing to gain from
   automating it. Worth remembering the day this project has anything worth botting.

### Skip for now — real systems, but each one is its own project

Colyseus (real-time multiplayer rooms), guilds, market, auction, real-money purchases, PvP arena,
crafting/forge. `vision.md` already rules the social ones out under "explicitly not wanted, so far,"
and this research doesn't change that call.

### 3.4 Why not just import Colyseus and PixiJS, since Baiak Idle uses them?

Because they each solve a problem your game doesn't have yet, and adopting a tool before you have
its problem is pure cost with no payoff.

- **PixiJS draws lots of moving sprites smoothly, at speed.** Your 0.1.0 has zero sprites — it's
  "ugly HTML buttons and text," on purpose (`design.md`'s Done-when checklist says so explicitly).
  Adding Pixi today would mean spending time learning a rendering library to draw *nothing*, because
  there's nothing yet to render. It belongs in Phase 2, exactly where `build-guide.md` already put
  it, once there's an actual sprite to animate.

- **Colyseus keeps many players' state in sync in real time — think "everyone in this room sees the
  same monster HP update within milliseconds."** Your 0.1.0 doesn't have that problem: it's **one
  player, one hero, and progress is a rate, not a live event stream** — `design.md` says outright
  "there's no fight — there's a rate." A rate is just a number that goes up; a client polling `POST
  /catch-up` every so often, or even just recomputing it from elapsed time on page load, covers
  that completely with a plain HTTP endpoint. Colyseus would buy you nothing here and cost you a
  whole new server concept (rooms, WebSocket connections, schema sync) to learn and operate.

  Colyseus becomes worth learning **only if** this game ever needs two players seeing the same
  live thing at once — party hunts, PvP, a shared boss fight. That's explicitly `vision.md`
  territory (parked, not ruled out), and even then, it's worth trying to get away with periodic
  polling for as long as possible before reaching for a persistent-connection library — polling is
  simpler to build, simpler to debug, and simpler to reason about.

**The general rule this follows:** match the tool to the problem you actually have this week, not
to the problem the more mature, three-years-older game has. Baiak Idle needed Pixi and Colyseus
because it has hundreds of monsters animating in real time for parties of players. 0.1.0 has three
zones and a number that goes up.

---

## 4. The licensing problem, stated plainly

Baiak Idle ships CipSoft's copyrighted sprites, item names, monster names and spell words wholesale,
and it **monetises** — real BRL via Pix, a coin economy, a store. That is the highest-risk
configuration available: it is not a non-commercial fan project, and its own asset ids are
self-incriminating in the sense that provenance can be established from public URLs in about ten
minutes, as §1.1 demonstrates.

This is normal in the OTServ scene and it is nonetheless legally exposed. Three options:

| Option | Verdict |
| --- | --- |
| Do what they did | **No.** The moment this is public and takes a cent, it's the same exposure with none of the community cover. |
| Take the *shapes*, none of the *assets or names* | **Yes.** Data schemas, formulas, the ability model and the spawn-queue architecture are ideas and structures. Sprites, monster names, spell incantations and outfit ids are the protected part. |
| Original art from day one | Already the plan — `build-guide.md` §2.3 (Kenney/CC0, commission, or Aseprite). |

**Practical rule for this project:** I may study `data/monsters.json` freely and adopt its *field
shapes and balance relationships*. I may not ship its names, its numbers verbatim as a content pack,
or anything pointing at `baiakidle.com/api/things/`.

---

## 5. What was verified since the first pass, and what's still open

Marked so a future session doesn't mistake inference for fact, and doesn't redo work that's done.

### Resolved

- ~~**Offline progress. This is the big one.**~~ **Resolved** — partly by re-reading the bundle's
  own UI strings, partly by your live report. It's neither of the two things I guessed. Baiak Idle
  runs a **banked-time system**, not a "leave the tab open" model and not a naive "always accrues"
  one:

  > *"A reserva enche enquanto você joga (1h jogada = 1h de reserva, até 12h)."*
  > — "The reserve fills up while you play (1h played = 1h of reserve, **up to 12h**)."

  So offline progress is a bank you fill by playing *live*, one hour of bank per hour actively
  played, capped at 12h — then it drains while you're away, at the same rate combat would have run.
  Two more gates found alongside it:

  - **A hunt must be fully cleared live before it can be hunted offline at all** — *"Only hunts with
    all waves cleared can be hunted offline."* Offline mode replays a hunt you've proven, it doesn't
    let you skip ahead.
  - **Death still applies.** *"Your party DIED and the offline hunt stopped there — the death
    penalty has already been deducted."* Offline is not risk-free.

  Your login summary confirms the rest of the shape: kills and XP appear directly, gold appears
  post-auto-sell rather than as items in your backpack — *"All loot was sold automatically (70% of
  its value)"* — because there's no inventory to place items into while you were gone. That 70%
  (versus presumably better manual-sell pricing) is the "cost" of being away, paid in gold rather
  than in a flat progress penalty.

  **Why this is worth more than a footnote:** `design.md`'s 12-hour cap is *the same number*, and
  that's a genuine, useful confirmation that 12h is a sane idle-game default rather than an
  arbitrary pick. But the *mechanism* is different in a way worth naming — Baiak Idle's cap is spent
  from a bank you fill by playing, so a player who never logs in for a week can't be earning at full
  rate the whole time; `design.md`'s cap is unconditional, so **every** absence up to 12h pays out
  at the full live rate regardless of how much you played beforehand. That's not a mistake — it's a
  simpler, more generous rule, and simpler is right for 0.1.0 — but it's a deliberate difference now
  instead of an accidental one, and it's the kind of thing worth one line in `design.md`'s Open
  section if a "reward returning players over lurkers" incentive ever becomes a design goal.
- ~~**How the player's own combat AI is scored (Battle Tactics).**~~ **Resolved** — see §1.5.
  `TY(level, tactics)` returns an `aimChance` probability, and it lives entirely in the client
  bundle's talent-tree code, so this one didn't need a live capture to settle.

### Still open

- Server language, framework and database — unobservable behind Cloudflare.
- Whether sprites were extracted from the legacy `.spr`/`.dat` pair or the modern protobuf appearance
  format. Item ids in the 47k–52k range imply a recent client, so probably the latter.
- Exactly how the 32 rolled gear attributes combine (additive vs multiplicative) — still open in the
  companion repo, blocked on measurement rather than on method.

---

## 6. How to spend the `tibia-idle` repo

That repo is two months of measurement against a live commercial idle game. Concretely useful here:

- **A proven damage law.** `dealt = floor(base × (1 − resist/100))`, negative resistance unclamped.
  If elemental damage ever enters this project, that's a validated starting point instead of a guess.
- **A 276-entry content corpus with a working schema**, for studying *relationships* — how HP, exp,
  armor and resistance scale together across a 1→610 level range. The numbers are a reference for
  curve shape, not a content pack to ship (§4).
- **The two-regime insight, which `design.md` does not yet have — explained with numbers.** A Baiak
  Idle hunt spawns a new monster every `spawnMs`. That's a hard ceiling: however strong you get, you
  cannot kill faster than monsters appear. Cyclopolis respawns every 2,800 ms, so its ceiling is
  `3,600,000 / 2,800 ≈ 1,285` kills/hour, full stop — no amount of extra damage buys a 1,286th kill.

  That creates two different bottlenecks, and which one you're in changes what "get stronger" even
  means:

  - **Damage-capped** — you're weak relative to the hunt. Killing faster directly raises your
    gold/hour, because monsters are queued up waiting for you. *More Attack always helps.*
  - **Spawn-capped** — you've outgrown the hunt. You're already one-shotting everything and waiting
    on the respawn timer. Killing faster does **nothing** — you're capped at 1,285 kills/hour no
    matter what. *More Attack buys literally zero extra gold here*, and the only way to earn more is
    to move to a hunt with a bigger cap or juicier loot.

  This is why "one number can't rank a hunt" — a hunt that looks amazing on `gold ÷ HP` (a
  damage-capped metric) can still be a bad choice if its spawn ceiling is low, and vice versa.

  **Now check `design.md` against this.** Its formula is `goldPerSec = zone.gold × lootMult ×
  damage / zone.hp` — there is no `spawnMs`, no monster count, nothing that caps kill rate. That
  means **the model is permanently and only damage-capped**: buying Attack always pays off, forever,
  with no regime where it stops mattering. That is a real simplification (not a bug — it's what
  keeps the whole model to five formulas), but it was implicit rather than chosen. It's worth one
  line in `design.md`'s *Accepted risks* table naming it on purpose: *"No spawn cap — Attack always
  pays off, by design, for 0.1.0."* If a future zone or boss system ever adds anything with a
  respawn timer, this insight is the reason to ask "am I damage-capped or spawn-capped here?" before
  trusting a single ranking number.
- **The uniform-multiplier result:** a multiplier applied evenly across content reorders nothing and
  only shifts the regime. That is exactly the tuning dial `design.md`'s zone table would want if the
  first-transition-at-9h question (its open item) turns out to need adjusting globally rather than
  per-zone.
- **The measurement methodology** — bracketing snapshots, change one variable per window, empty the
  rotation to isolate a single damage source. I will need this to validate my own balance model, and
  it'll be *far* easier: I own the server, so I can log directly instead of decoding a socket.
- **The ability schema** (§1.5), for the day `vision.md`'s waves and bosses arrive.

---

## 7. What this must **not** do to 0.1.0

The whole reason `vision.md` exists is to stop research like this from leaking into the build. So,
explicitly:

**Do not import:** Colyseus, WebSockets, a rendering layer, 276 monsters, a talent tree, gear tiers,
rarities, imbuements, a rotation system, or a helper. Baiak Idle is years of accumulated systems.
`design.md` is five formulas and two buttons, and that is correct for what 0.1.0 is *for* — learning
how a game is built end to end.

**The design principle that applies here** is already written down: *a thing with no decision
attached is filler.* Nothing in this document creates a decision for the player of 0.1.0.

Three things earn a line somewhere — and a line is all they earn:

1. **The spawn-cap regime** — name the simplification in `design.md`'s accepted risks (§6).
2. **A multiplier layer** — a global tuning dial over content, in `vision.md` as a constraint on the
   content schema, not as a feature.
3. **The ability schema shape** — in `vision.md` next to waves/bosses, so combat arrives as a
   content edit rather than a redesign.

Everything else in this document is for later, or for never.

---

## References

**Verified live 2026-08-11:** `https://baiakidle.com/jogar/` · `/jogar/assets/index-CBHS77YQ.js` ·
`/api/things/manifest.json` · HTTP response headers on `/` and `/jogar/`.

**From the companion repo** (`~/dev/personal/tibia-idle`):
- `tools/socket-capture/internals.md` — Colyseus wire format, the `combatlog` schema, the `fx` channel
- `docs/knowledge-base/wiki/09-api-trpc.md` — the tRPC surface; the client-has-no-damage-roll finding
- `docs/knowledge-base/wiki/10-hunts-e-monstros.md` — hunt/monster catalog, `monsterMult`, the two regimes
- `docs/explorations/07-damage-formula.md` — the resistance law, proven over 7,179 hits
- `docs/explorations/08-combat-action-model.md` — the four damage sources; ability attribution
- `docs/explorations/09-forcing-the-game-to-persist-state.md` — state persists on reconnect; superseded here by the banked-time finding in §5
- `docs/roadmap/46-sprite-images.md` — the sprite manifest as an asset architecture
- `data/{monsters,hunts,items,spells,bosses}.json` — the content corpus

**In this repo:** [`design.md`](../design.md) · [`vision.md`](../vision.md) ·
[`research/build-guide.md`](../research/build-guide.md)
