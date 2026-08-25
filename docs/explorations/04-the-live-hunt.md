# 04 — The live hunt: arenas, tiers, and what the player does while it runs

**Verdict:** viable, not yet spiked · **Opened:** 2026-08-22 · **Closed:** 2026-08-22

> Opened because the online mode had never been designed, only assumed.
> [`alpha.md`](../../alpha.md) decision 3 states that *"the player never presses a
> button during a fight."* The game as actually intended has the player changing
> gear, gambits, skill points and monster targeting continuously while watching.
>
> **Two of the four foundational decisions moved.** Decision 3's premise is
> replaced; decision 2 survives with its scope narrowed to offline.

> **Amended 2026-08-24 by the alpha scope audit.** Five decisions below moved, and
> the Still open list at the end is closed. #13 *"skill points, any tick, no cost"*
> is narrowed: **spending** a newly earned point is a mid-fight action, **reallocating**
> a spent one is not. #20 *"potions are free"* keeps a **single cooldown shared across
> health and mana**, and mana now matters because active skills cost it. #25 offline is
> **Easy and Medium only, at reduced experience and drop rates**, and **one sealed session
> per account** rather than per character. #11's loot now lands in a **capacity-capped**
> backpack that forfeits drops when full rather than ending the run. The exp/hour window
> is a **rolling five minutes**, and the daily Hard count **refills at a fixed UTC hour**.
> All of it is in [`alpha.md`](../../alpha.md); the findings below hold otherwise.

## The question

What is a live hunt? Specifically: what exists on the server, how long does it
live, who is allowed in it, what can a player change while it runs, what does
losing cost, and what does a second player change about any of it.

## Why it needed an exploration rather than a decision

Every doc in the tree was written against a solo, sealed, non-interactive fight.
The intended game is a live, shared, continuously-tuned one. That is not a
detail — it is a different set of load-bearing assumptions, and each doc had
absorbed the old ones in a different place. The render-buffer functional
requirement (`alpha.md`'s Functional Requirements table, originally
`architecture-web.md`) justified its render delay with "the player cannot act
during a fight". The freeze-on-seal requirement (same table, originally
`architecture-api.md`) froze the character at run start.
`alpha.md` capped the experience available in a hunt loop, which only makes sense
if a loop ends. None of them were wrong; all of them were downstream of a premise
nobody had revisited.

## The vocabulary

Three different things were all called *hunt*. They have three different
lifetimes, so they get three different words. This is now
[`naming.md`](../naming.md) rule 6.

| Word | What it is | Lifetime |
| --- | --- | --- |
| **Hunt** | The content: monsters, wave program, spawn cap, drop tables | Permanent, in the content pack |
| **Arena** | The live room being simulated | In memory only, while at least one player stands in it |
| **Run** | One player's stint inside an arena | Starts on entry, ends on exit, banks continuously |

*Arena* is not a new coinage — `alpha.md` decision 1 is titled *"Arena, not map"*
and `architecture-web.md`'s renderer-boundary section already says *"the arena event stream"*. The word
was already doing this job.

## The invariant

Everything below holds together because of one rule, now in
[`alpha.md`](../../alpha.md)'s Functional Requirements table:

> **One player-hour produces one player's worth of XP and loot** — whatever the
> density, whatever the party size.

Tier changes the **quality** of what drops and gates bosses. Density changes the
**shape** of the fight, so a different build wins. Party size changes **neither**.
It is the test to run against any future balance change.

## What was decided

### The arena

1. **A hunt is a place, not a run with a finish line.** Monsters spawn in waves;
   the cap on how many are alive rises with each wave.
2. **An arena exists only while someone is standing in it.** Created on first
   entry, destroyed when the last player leaves. Wave progress dies with it, so
   every session starts at wave 1.
3. **Alpha arenas are private to one party.** No city, no strangers, no shared
   world. Outside a hunt the player sees configuration UI and inventory, nothing
   else.
4. **Nothing about the arena is ever stored.** Positions, health, cooldowns, the
   wave counter — all in memory, all discarded.

### Tiers, density and bosses

5. **Each hunt has three tiers: Easy, Medium, Hard.** Tier sets monster strength
   and how deep the wave program goes.
6. **Easy and Medium loop forever and have no boss.** They are where experience
   and lower-tier items come from.
7. **Hard ends.** Its wave program has a final wave, then a boss, then the arena
   closes.
8. **Hard is limited to N runs per day.** While the count lasts a party may loop
   it; when it is spent they are returned to the menu. This is the primary brake
   on high-tier items entering the world.
9. **Density is the player's choice at any tier** — High Density spawns more,
   weaker monsters; Low Density spawns fewer, tougher ones. It maps onto the two
   forms the Beastmaster already has: Werebear and Bear Presence for area,
   Werewolf for single target.
10. **The two densities must produce equal XP per hour, and therefore equal
    clear time.** If Low Density clears more slowly, its Hard runs earn a worse
    boss-loot bonus and the mode is punished for existing.
11. **Bosses are the best loot source, not the only one.** Monsters drop at a
    reduced rate; bosses carry higher tiers and better rare chances.
12. **Tier, density and party size are multipliers over three base hunts.** Not
    eighteen hand-authored tables that drift apart.

### What the player does during a fight

13. **The player edits continuously and everything is instant.** Gear, gambits,
    skill points and monster targeting, any tick, no cost. This replaces
    `alpha.md` decision 3's premise.
14. **Monster targeting is a second ordered list**, authored the same way as the
    skill priority list — conditions from a fixed vocabulary, read top down,
    first match wins.
15. **The player still never presses *attack*.** Decision 3's conclusion survives
    intact: the character fights itself, and the play is authoring how. What
    changed is that the authoring now happens while watching rather than only
    before.

### Cost and loss

16. **XP banks continuously, per kill.** There is no unbanked progress, so
    leaving, crashing or dying never costs XP already earned.
17. **Death costs XP and one random gear piece.** The piece is destroyed —
    nothing lands on the ground, per `alpha.md`'s Functional Requirements
    table (loot resolves straight into the inventory).
18. **No de-levelling in the alpha.** XP loss stops at the floor of the current
    level.
19. **Leaving takes five seconds, and a dropped connection is a leave.** The
    character stays in the fight for those five seconds and can die in them, so
    quitting and crashing are the same event and there is nothing to game.
20. **Potions are items, not skills.** Free in the alpha and tiered by level
    unlock — inferior from the start, common at 10, superior at 30. They are
    items so that paid potions slot in later without a model change.

### Parties

21. **Monsters scale with the number of players in the arena.** Four players face
    roughly four times the monsters and four times the cap.
22. **Every player spends their own daily run and rolls their own loot,
    undivided.** Dividing boss loot by party size was considered and rejected:
    with the daily cap already limiting how many high-tier items a player can
    earn per day, division taxes grouping twice for one goal — and because the
    alive-cap bounds throughput, a group can never clear N times faster, so
    division makes grouping strictly worse than solo by construction.
23. **XP splits evenly across the party.** Combined with scaled monsters this is
    exactly neutral: four players facing four times the monsters and taking a
    quarter each earn what they would have earned alone.
24. **Build for N players, ship solo.** The arena holds a list of players and XP
    splits by headcount from day one — a headcount that happens to be 1. Invites,
    the party screen and join/rejoin flows are deferred, and turning them on is a
    UI feature rather than a rewrite.

### Offline

25. **Offline ships in the alpha, unchanged and sealed.** Gear, skills and the
    rule list freeze at logout; the session is replayed exactly once at the next
    login. Offline is solo by construction — a party is live people.
26. **Offline honours the player's Stop/Retry setting**, including the harsh
    case: on Retry a player can lose several levels and several gear pieces
    overnight, by choice. This is `vision.md`'s stated intent, pulled forward.
27. **The login summary is therefore an alpha feature**, not a nice-to-have —
    time away, waves cleared, bosses, net XP, deaths, gear lost and gained.

### Telemetry

28. **Death and outcome records are stored, structured and queryable.** Not to
    replay a fight — to answer "how are players dying, to which element, to which
    monster, at which wave". This is the one stated exception to `alpha.md`'s
    *"nothing about a fight is ever written to the database"*, and it is bounded:
    outcomes and deaths, never the world.
29. **Live hunts are not re-runnable.** Logging every input with its tick was
    considered and rejected — it is a table that grows with player activity plus
    a rule that every edit path must record itself, and missing one produces a
    replay that silently diverges, which is worse than no replay. Determinism
    remains a property of the simulation code regardless; what is dropped is the
    recording.

## What happened to the foundational decisions

**Decision 3 — "The player authors behaviour".** Its premise is replaced. It said
*"The player never presses a button during a fight, so the fight is not where the
decisions are."* The player now edits during the fight. Its **conclusion is
untouched**: the decisions still live in the rule list, and the player still never
issues a combat command. The fight became the feedback loop for authoring rather
than a sealed consequence of it.

**Decision 2 — "Offline is replay".** Survives, scope narrowed. Sealing, freezing
and exactly-once replay are now explicitly properties of *offline*, not of every
hunt. The persist-offline-inputs and freeze-on-seal functional requirements
(`alpha.md`'s Functional Requirements table, originally `architecture-api.md`
rules 11 and 22) move with it.

**Decisions 1 and 4** — Arena, and server-authoritative — are untouched and are
what makes all of the above cheap.

## What changed in each doc

| Doc | Was | Now |
| --- | --- | --- |
| `alpha.md` decision 3 | the player never acts during a fight | the player tunes continuously; the character still fights itself |
| `alpha.md` decision 2 | every hunt is sealed and replayed | sealing is offline's property; live hunts are not replayed |
| `alpha.md` loop | pick → waves → boss → collect → repeat | pick hunt, tier and density → an arena that loops or ends at a boss |
| `alpha.md` progression | a hunt loop has a pre-defined XP cap | hunts have no cap; Easy and Medium never end |
| `alpha.md` "Still open" → Death | undecided, may not exist | XP plus one destroyed gear piece; Stop/Retry setting |
| `alpha.md` persistence | nothing about a fight is stored | plus a bounded exception for outcome and death records |
| `alpha.md`'s Functional Requirements (persist offline-session seed & inputs; freeze equipment/skills/rules at seal) | persist inputs, freeze at run start | offline only |
| `alpha.md`'s Functional Requirements (a dropped socket is a leave) | a dropped socket ends the hunt | a dropped socket is a leave: five seconds, then exit and bank |
| `architecture-api.md`'s simulation-boundary section (project in, never write back) | project in, never write back | still true; live edits are inputs *into* the arena, never writes out of it |
| `alpha.md`'s Functional Requirements (render buffer) | "the player cannot act during a fight" | the delay is justified by the player never issuing combat commands |
| `naming.md` | — | rule 6: Hunt / Arena / Run |
| `alpha.md`'s Functional Requirements | — | one player-hour, one player's worth |
| `explorations/02` | `HuntRun` hangs off one Character | a Run is per-player; Arena is a new in-memory concept it never modelled |
| `explorations/03` | reopen if the player can act | reopen if a client changes the world locally, or players need different views |

## Deferred, and the constraint each one needs today

- **De-levelling.** → *Constraint:* store XP as one absolute total and derive the
  level from it. Stored as "level plus progress", de-levelling later is a
  migration; derived, it is a balance change.
- **Paid potions and the economy.** → *Constraint:* potions are items now, never
  skills.
- **Items that prevent gear loss on death.** → *Constraint:* gear loss runs
  through exactly one code path that an item can veto.
- **A city, world bosses, and arenas larger than a party.** → *Constraint:*
  nothing may hard-code "one arena per party".
- **Party UI** — invites, joining, rejoining. → *Constraint:* the arena holds a
  list of players and scales by headcount from the first line of code.
- **Trading.** Unchanged from `vision.md`; it redistributes items, it does not
  create them, so it does not affect any balance above.

## Still open

*Closed 2026-08-24 except the numbers.* Whose daily Hard count is spent was already
answered by #22 (each player's own); when it resets, the potion cooldown and the exp/hour
window are all settled in [`alpha.md`](../../alpha.md).

- The numbers: wave depth per tier, cap escalation per wave, the boss-loot curve
  against clear time, and the tier and density multipliers.

## Findings

The productive question was not "how do we support multiplayer" — it was **"what
can the player change, and when."** Once mid-fight editing was admitted, the
sealed run stopped being the unit of anything and the arena appeared underneath
it as the thing that actually has a lifetime. Every other answer followed from
naming that.

Two rejections carried the most weight, and both were arithmetic rather than
taste. Dividing boss loot by party size cannot work: the alive-cap bounds a
group's throughput, so a group can never clear N times faster, and division
therefore makes grouping strictly worse no matter how the numbers are tuned. And
scaling monsters by headcount is what makes even XP splitting correct rather than
punitive — the two decisions are only sound together.

The invariant — one player-hour, one player's worth — is the compressed form of
both, and it is the thing to check first when any of these numbers next move.
