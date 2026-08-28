# Requirements

Append-only log of user needs and functional requirements. Written by
`msg-pre-roadmap`, read by `msg-roadmap-plan-item`'s gate-check. Never edit or
delete a row — add new ones.

**`UN`/`FR` codes are unique across the whole file, not per module.** `Client`
continues `Account`'s sequence at `UN.7` rather than restarting at `UN.1`. This
is deliberate and was confirmed 2026-08-28: `auth.md` rule 7 cites `FR.7.2` and
`stack-api.md` rule 39 cites `FR.5.1` with no module qualifier, so a bare code
already has to resolve to exactly one row. The `msg-pre-roadmap` skill describes
per-module numbering; where the two disagree, this file wins, because the rule
docs cite it and not the skill.

## The alpha's features, in plain English

Seeded 2026-08-24 from [`alpha.md`](../alpha.md) by
[`prompts/audit-alpha-scope-and-seed-the-feature-list.md`](prompts/audit-alpha-scope-and-seed-the-feature-list.md).
One sentence each, saying what a player experiences. The table below carries the same
list, with every other column marked `TODO` until `msg-pre-roadmap` runs on that feature.

Ordered by build dependency: nothing appears before something it needs. It is not a
roadmap — no dates, no estimates — but the first row is the natural starting point.

**Modules are game systems, not layers.** Back-end / Front-end / Auth are *areas*, recorded
in a roadmap item's own Key Areas section, not here.

1. **Account sign-up and login** — a player creates an account with an e-mail and a
   password and comes back to it later. Closed-alpha access is an unlisted URL, not an
   invite code.

2. **Character creation and selection** — a player names a Beastmaster and plays it, and an
   account can hold several so two builds can be compared side by side. The select screen
   shows which character is currently hunting offline.

3. **Arena grid and movement** — the character and the monsters occupy tiles in a small
   wall-free room and step one tile toward whatever they are targeting, with no pathfinding
   and no line of sight. *Load-bearing underneath it:* two entities can never claim the same
   tile in a tick, so tile reservation resolves in a fixed deterministic order, and entities
   carry a facing, which is what makes a cone attack mean anything.

4. **Automatic combat** — the character attacks on its own, damage lands, resistances and
   critical hits apply, and monsters die. *Load-bearing underneath it:* one fixed tick rate
   that never changes, fixed-point integers rather than floats, and content loaded as
   validated data so a new monster is a file edit.

5. **Hunt selection** — a player picks one of three hunts, a tier and a density, sees a
   recommended level that is advice rather than a wall, and enters. Leaving takes five
   seconds during which the character is still in the fight and can still die — and a
   dropped connection is a leave, so quitting and crashing are the same event.

6. **Escalating waves and the alive cap** — monsters spawn in waves and the cap on how many
   can be alive at once rises as the waves go deeper. *Load-bearing underneath it:* monster
   count and the cap scale by the number of players in the arena, with a headcount that
   happens to be 1 for the whole alpha.

7. **Live battle view** — the player watches the fight happen on a 32×32 top-down grid, with
   real sprites for Human, Werewolf and Werebear and for the three monster variants, so a
   form change is something you see rather than something you infer. Static frames are
   enough; animation is deferred. *Load-bearing underneath it:* the event stream carries a
   version the client refuses to mismatch, and the renderer draws two ticks in the past so
   motion is smooth.

8. **Character sheet** — a player sees every attribute they have and, for each one, where it
   came from: this item, that skill, this buff. Not a summed number with no explanation.

9. **Skill priority list** — a player writes an ordered list of rules, each one a condition
   from a fixed vocabulary plus the skill to cast, and every tick the first row whose
   condition holds and whose cooldown is ready fires. This is the game. It ships before the
   skills it will eventually name, initially driving little more than the auto-attack.

10. **Monster targeting list** — a second ordered list, authored the same way, deciding
    which monster the character attacks: kill the fire variant first, lowest health first.

11. **Mid-fight editing** — a player changes gear, either rule list, or spends a newly
    earned skill point while the fight is running, and it takes effect on the very next
    tick. No cost, no cooldown, nothing to wait for.

12. **Fight HUD and gambit trace** — a status panel showing health, mana, current form,
    buffs with time remaining, wave number and a rolling five-minute experience-per-hour
    average; and, crucially, the live rule list highlighting the row that fired and greying
    each skipped row with the reason it was skipped. Without the trace a player retunes by
    guessing.

13. **Experience, levels and skill points** — killing a monster banks experience
    immediately, levels arrive up to a cap of 30, and each level grants one skill point plus
    a rise in base health and base mana. No free damage: that comes only from gear and from
    points the player chose to spend.

14. **Skill respec** — a player pulls spent skill points back out and reassigns them, free of
    charge, on the configuration screen. Not during a fight: a pool with no opportunity cost
    would otherwise be re-optimised every wave.

15. **Werewolf form** — the character becomes a wolf, trading health for attack speed on the
    transformation and gaining physical damage and life leech while it lasts. Costs mana, and
    a five-second shapeshift cooldown means committing to it.

16. **Werebear form** — the character becomes a bear, trading attack speed for extra health,
    elemental resistance and health regeneration. Same mana cost and same five-second
    commitment; Human Form is free, always known, and the way back out of either.

17. **Claw Strike** — an attack that hits three monsters standing in front of the character
    at once, which is what makes facing and cone targeting matter.

18. **Effective Killer** — while in Werewolf form the character's critical chance climbs
    every second up to a ceiling, and it is lost the moment the form ends.

19. **Bear Presence** — while in Werebear form the character burns every enemy within a
    radius for fire damage each second, up to a ceiling, and it is lost the moment the form
    ends.

20. **Human in the Loop** — damage dealt and taken accumulates, and in human form it becomes
    a barrier that absorbs a set amount and halves whatever exceeds it. Every level also
    shortens the shapeshift cooldown by a quarter second.

21. **Equipment slots** — six slots (helmet, armor, legs, gloves, boots and a claw) that a
    player fills from their inventory, with what is equipped feeding straight into the
    character sheet and the fight.

22. **Loot drops and rarity** — killing a monster can drop an item that lands directly in the
    inventory, with no item on the ground and nothing to walk over. Monsters drop at a
    reduced rate; bosses drop the good things.

23. **Prefix and suffix rolls** — an Uncommon item carries one rolled prefix and one rolled
    suffix on top of its base defence, so two items of the same slot and rarity are a real
    comparison. *Load-bearing underneath it:* variety comes from the roll ranges, not from
    the number of affix pairings.

24. **Inventory capacity and discard** — the backpack holds a fixed number of items and the
    player discards what they do not want. When it fills the hunt keeps running and
    experience keeps banking, but further drops are forfeited — and the player is told
    immediately and loudly, never after the fact.

25. **Potions** — health and mana potions are items, free and unlimited, unlocking better
    tiers at levels 10 and 30, and a rule list drinks them like any other conditional
    action. One cooldown is shared across every potion of both families, so healing locks
    out a mana potion and the threshold a player writes is a real decision.

26. **Death penalty** — dying costs experience, never a whole level, plus one random equipped
    item destroyed outright. A per-account Stop or Retry setting decides whether the
    character leaves the arena or respawns and keeps going. *Load-bearing underneath it:*
    every death is recorded as a queryable row — which monster, which damage type, which
    wave — because that is a balance question, and it is the one stated exception to nothing
    about a fight being stored.

27. **Boss fight** — Hard tier ends at a final wave and then a boss, which is the best source
    of high-tier items in the game. Boss loot scales with how fast the arena was cleared.

28. **Daily Hard-run cap** — a player gets a limited number of Hard runs per day, refilling
    in full at a fixed UTC hour. This is the only brake on high-tier items entering the
    world, so every player spends their own count and rolls their own loot undivided.

29. **Sealed offline session** — a player deliberately picks an Easy or Medium hunt, logs
    out, and the fight is replayed exactly once at their next login with gear, skills and
    rule lists frozen at the moment they sealed it. Experience and drops are reduced, because
    being present should pay better than being away. *Load-bearing underneath it:* seeded
    randomness so a replay cannot be rerolled by refreshing, a cap on how much elapsed time
    one catch-up will replay, and one sealed session per account rather than per character.

30. **Login summary** — coming back shows what happened while away: time elapsed, waves
    cleared, net experience, items gained, and — first and loudest — everything lost. Deaths,
    destroyed gear, and drops forfeited to a full backpack.

31. **Language and localisation** — the interface reads in English or Portuguese, chosen by
    the player and remembered on their account, and switchable before they even have one.
    The names of things in the game world — hunts, monsters, skills, item prefixes and
    suffixes — stay English in both, so a monster is called the same thing in the client, in
    a wiki and in a bug report. *Load-bearing underneath it:* Portuguese runs roughly 40%
    longer than English on short labels, so nothing translated truncates.

| Module | Feature | User Need Code | User Need Details | Functional Requirement Code | Functional Requirement Details | Addition Date |
| ------ | ------- | --------------- | ------------------ | ---------------------------- | -------------------------------- | -------------- |
| Account | Account sign-up and login | UN.1 | A player needs an account that outlives the browser tab, so characters, gear and progress are still there when they come back. | — | — | 2026-08-25 |
| Account | Account sign-up and login | UN.1 | — | FR.1.1 | Sign-up creates an account from an e-mail address and a password, and signs the player in. | 2026-08-25 |
| Account | Account sign-up and login | UN.1 | — | FR.1.2 | The e-mail address is an identifier only — never verified and never sent to. The alpha has no outbound e-mail of any kind. | 2026-08-25 |
| Account | Account sign-up and login | UN.1 | — | FR.1.3 | A password is 8 to 128 characters with no composition rules, and is stored hashed, never in plain text. | 2026-08-25 |
| Account | Account sign-up and login | UN.1 | — | FR.1.4 | Sign-up is refused when the e-mail address already has an account. | 2026-08-25 |
| Account | Account sign-up and login | UN.1 | — | FR.1.5 | There is no self-service password reset; recovering a forgotten password is a manual database operation by the operator. | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | A player needs to stay signed in between play sessions, and auth must never be the reason they lose a fight. | — | — | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | — | FR.2.1 | A session is a server-side row in the project's own Postgres, not a stateless token, so ending one is a delete. | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | — | FR.2.2 | A session lasts 30 days, and its expiry is extended while the player is active. | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | — | FR.2.3 | Session expiry never terminates a running hunt; only a game rule ends a fight. | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | — | FR.2.4 | Signing out destroys that device's session on the server; other signed-in devices keep their own. | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | — | FR.2.5 | Signing out while hunting runs the same five-second leave as any other disconnect. | 2026-08-25 |
| Account | Account sign-up and login | UN.2 | — | FR.2.6 | Deleting a session closes the sockets that session opened, so revoking a session takes effect at once rather than when the player happens to disconnect. The close runs the ordinary five-second leave. | 2026-08-28 |
| Account | Account sign-up and login | UN.3 | A player needs "online" and "away" to be unambiguous, because the game pays out differently for each. | — | — | 2026-08-25 |
| Account | Account sign-up and login | UN.3 | — | FR.3.1 | An open socket connection is what "online" means; it opens when a character is selected, and the hunt runs over it. | 2026-08-25 |
| Account | Account sign-up and login | UN.3 | — | FR.3.2 | The socket handshake is authenticated against the same server-side session as ordinary requests, and the server checks the request's Origin on every connection. | 2026-08-25 |
| Account | Account sign-up and login | UN.3 | — | FR.3.3 | The server detects a dead socket itself, by heartbeat and timeout, rather than trusting the client to close it. | 2026-08-25 |
| Account | Account sign-up and login | UN.3 | — | FR.3.4 | Losing the socket takes the character offline; if it was hunting, the five-second leave runs first and its result is banked. | 2026-08-25 |
| Account | Account sign-up and login | UN.3 | — | FR.3.5 | Reconnecting within the five-second leave cancels the leave and resumes the hunt, so a brief network blip does not cost a player their fight. | 2026-08-26 |
| Account | Account sign-up and login | UN.3 | — | FR.3.6 | The heartbeat is tuned so a client that vanishes without closing cleanly is detected in seconds rather than tens of seconds; detection can never be instant, but the gap must stay proportionate to the five-second leave. | 2026-08-26 |
| Account | Account sign-up and login | UN.4 | A player must not be able to corrupt or duplicate their own progress by opening a second tab. | — | — | 2026-08-25 |
| Account | Account sign-up and login | UN.4 | — | FR.4.1 | An account has at most one character online at a time. | 2026-08-25 |
| Account | Account sign-up and login | UN.4 | — | FR.4.2 | A connection for an account that already has a character online is refused with a stated reason, and nothing already running is interrupted. | 2026-08-25 |
| Account | Account sign-up and login | UN.4 | — | FR.4.3 | Claiming the online slot is atomic, so two connections arriving together cannot both succeed. | 2026-08-25 |
| Account | Account sign-up and login | UN.4 | — | FR.4.4 | Switching characters requires explicitly leaving the current one, which runs the same five-second leave and so offers no escape from an imminent death. | 2026-08-25 |
| Account | Account sign-up and login | UN.4 | — | FR.4.5 | The online-slot check sits behind one named component, so moving it off single-process memory later does not touch its callers. | 2026-08-25 |
| Account | Account sign-up and login | UN.5 | Alpha players need the game to stay closed once the unlisted URL is pasted somewhere public. | — | — | 2026-08-25 |
| Account | Account sign-up and login | UN.5 | — | FR.5.1 | Sign-in attempts are rate-limited, per source address and per account. | 2026-08-25 |
| Account | Account sign-up and login | UN.5 | — | FR.5.2 | Registration can be closed by configuration, refusing new sign-ups while existing accounts continue to work. | 2026-08-25 |
| Account | Account sign-up and login | UN.5 | — | FR.5.3 | Rate-limit counters are held in process memory, which is correct only while the API runs as a single process; a second process requires shared storage first. | 2026-08-25 |
| Account | Account sign-up and login | UN.6 | A player returning after a long absence needs signing in to be immediate, however long they were away. | — | — | 2026-08-25 |
| Account | Account sign-up and login | UN.6 | — | FR.6.1 | Signing in never runs an offline replay and never blocks on one, however much time has elapsed. | 2026-08-25 |
| Account | Account sign-up and login | UN.6 | — | FR.6.2 | A sealed offline session is replayed when its character comes online, not when the account signs in. | 2026-08-25 |
| Account | Character creation and selection | TODO | TODO | TODO | TODO | 2026-08-24 |
| Simulation | Arena grid and movement | TODO | TODO | TODO | TODO | 2026-08-24 |
| Simulation | Automatic combat | TODO | TODO | TODO | TODO | 2026-08-24 |
| Hunts | Hunt selection | TODO | TODO | TODO | TODO | 2026-08-24 |
| Hunts | Escalating waves and the alive cap | TODO | TODO | TODO | TODO | 2026-08-24 |
| Client | Live battle view | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Character sheet | TODO | TODO | TODO | TODO | 2026-08-24 |
| Authoring | Skill priority list | TODO | TODO | TODO | TODO | 2026-08-24 |
| Authoring | Monster targeting list | TODO | TODO | TODO | TODO | 2026-08-24 |
| Authoring | Mid-fight editing | TODO | TODO | TODO | TODO | 2026-08-24 |
| Client | Fight HUD and gambit trace | TODO | TODO | TODO | TODO | 2026-08-24 |
| Progression | Experience, levels and skill points | TODO | TODO | TODO | TODO | 2026-08-24 |
| Progression | Skill respec | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Werewolf form | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Werebear form | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Claw Strike | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Effective Killer | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Bear Presence | TODO | TODO | TODO | TODO | 2026-08-24 |
| Character | Human in the Loop | TODO | TODO | TODO | TODO | 2026-08-24 |
| Items | Equipment slots | TODO | TODO | TODO | TODO | 2026-08-24 |
| Items | Loot drops and rarity | TODO | TODO | TODO | TODO | 2026-08-24 |
| Items | Prefix and suffix rolls | TODO | TODO | TODO | TODO | 2026-08-24 |
| Items | Inventory capacity and discard | TODO | TODO | TODO | TODO | 2026-08-24 |
| Items | Potions | TODO | TODO | TODO | TODO | 2026-08-24 |
| Progression | Death penalty | TODO | TODO | TODO | TODO | 2026-08-24 |
| Hunts | Boss fight | TODO | TODO | TODO | TODO | 2026-08-24 |
| Hunts | Daily Hard-run cap | TODO | TODO | TODO | TODO | 2026-08-24 |
| Offline | Sealed offline session | TODO | TODO | TODO | TODO | 2026-08-24 |
| Offline | Login summary | TODO | TODO | TODO | TODO | 2026-08-24 |
| Client | Language and localisation | UN.7 | A player needs to read the interface in their own language, including on the login screen they reach before any account exists. | — | — | 2026-08-27 |
| Client | Language and localisation | UN.7 | — | FR.7.1 | Every developer-written string — labels, buttons, validation messages, empty states, gambit skip reasons — ships in both English and Portuguese from the first screen. | 2026-08-27 |
| Client | Language and localisation | UN.7 | — | FR.7.2 | The active language is held on the account and never in the URL, mirrored locally so a returning player does not see a frame in the wrong language. | 2026-08-27 |
| Client | Language and localisation | UN.7 | — | FR.7.3 | A signed-out player can switch language on the login and sign-up screens, and that choice is carried onto the account they create. | 2026-08-27 |
| Client | Language and localisation | UN.7 | — | FR.7.4 | A component with a fixed width is sized against the Portuguese string, and no translated string is ever truncated. | 2026-08-27 |
| Client | Language and localisation | UN.8 | A player needs a monster, hunt or skill to be called the same thing in the client, in a wiki, in chat and in a bug report. | — | — | 2026-08-27 |
| Client | Language and localisation | UN.8 | — | FR.8.1 | Hunt, monster, skill, prefix and suffix names are one authored English string, identical in both languages, and adding one stays a single content edit. | 2026-08-27 |
| Client | Language and localisation | UN.8 | — | FR.8.2 | A name the client cannot resolve renders as its raw id rather than as an empty label. | 2026-08-27 |
