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

**The Scaffolding module is deliberately absent from the list above.** That list
is one sentence per player experience, and nothing a player experiences is
scaffolding. Its rows say what a developer or an operator needs, the way
`FR.5.3` already does. Added 2026-08-28, before **Account sign-up and login**
was started, because the whole foundation would otherwise have been built inside
that feature — and because every other feature depends on the scaffold rather
than on login.

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
| Scaffolding | Project scaffolding | UN.9 | A developer needs every part of the system to have one obvious home, so building a feature is writing code rather than inventing structure alongside it. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.1 | The repository is a pnpm workspace holding `apps/api`, `apps/web` and the shared packages `libs/contracts`, `libs/simulation` and `libs/content`. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.2 | `libs/simulation` declares no dependencies at all, which is what makes its determinism rules enforced rather than remembered. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.3 | `apps/api` divides into the four modules `auth`, `player`, `character` and `hunt`, each with `domain`, `application`, `infrastructure` and `entrypoint` layers. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.4 | `apps/web/src` holds exactly `routes`, `features`, `renderer`, `transport`, `ui` and `lib`, with nothing beside them but the entry point and the generated files. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.5 | `libs/simulation` and `libs/content` exist as empty packages: the homes for combat and content are placed, not populated. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.6 | The repository runs on NestJS 12 and Node 24. The Node floor is forced rather than chosen — the generated-code and test tooling requires at least 22.18. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.10 | A developer needs proof that every layer of the system connects to the next, before any feature is built on top of it. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.10 | — | FR.10.1 | One path runs end to end: a web route renders data fetched by a generated hook from an API endpoint that reads Postgres through the ORM. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.10 | — | FR.10.2 | That path reads a `server_meta` row seeded by the first migration and returns the socket protocol version, the content-pack version and the build id. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.10 | — | FR.10.3 | A socket connection carries that same protocol version at its handshake, and the client refuses to proceed on a mismatch. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.10 | — | FR.10.4 | Nothing on that path is a throwaway fixture. Every part of it is required by a rule that already exists and survives into the alpha. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | A developer needs generated code that cannot silently disagree with the source it came from. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | — | FR.11.1 | Zod schemas in `libs/contracts` are the single source for request validation, the OpenAPI document and the socket message types. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | — | FR.11.2 | The OpenAPI document is produced by booting the API in preview mode, opening no port and connecting to no database, so generating it needs nothing running. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | — | FR.11.3 | The API client, the query hooks and the network fakes used in tests are all generated from that document; none of the three is hand-written. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | — | FR.11.4 | Every reusable schema and every enum carries an explicit name in the OpenAPI document, so no generated type is ever named after its position. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | — | FR.11.5 | Every generated file is committed, and CI regenerates them and fails on any difference. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.11 | — | FR.11.6 | One command regenerates all of them, so a fresh clone type-checks after a single step rather than failing in a way that looks like broken code. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.12 | A developer needs the architecture rules checked by a machine, because a boundary that is only documented is one nobody notices being crossed. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.12 | — | FR.12.1 | A linter runs over every package in the repository. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.12 | — | FR.12.2 | A separate dependency check fails on an outward import between layers, a cross-import between sibling features, or any import into `renderer/` other than the generated theme module. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.12 | — | FR.12.3 | That check counts type-only imports, which otherwise vanish at compile time and pass a boundary rule that should have failed. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.13 | A developer needs one shape for every error and every log line, fixed before the first feature writes one. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.13 | — | FR.13.1 | Every HTTP error response has the shape `{ statusCode, code, message }`, normalised in one place, where `code` is a machine-readable value and `message` is for developers. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.13 | — | FR.13.2 | A socket error reply carries that same `code` plus the correlation id of the message that caused it, and never closes the connection. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.13 | — | FR.13.3 | The web renders an error from its `code` through the translation catalogue, never from the server's message. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.13 | — | FR.13.4 | A logger is injected and never constructed in place, and HTTP request context is initialised once, before any handler runs. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.13 | — | FR.13.5 | The API takes the client address from the proxy's forwarded header, so a log line and a rate-limit counter see the real caller rather than the proxy. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.14 | An operator needs a misconfigured deployment to fail immediately and name the value that is wrong. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.14 | — | FR.14.1 | Every environment variable is declared in a schema validated at start-up; a missing or malformed value stops the process and names the field. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.14 | — | FR.14.2 | A committed example file lists every variable the system reads. No file holding real values is ever committed. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.14 | — | FR.14.3 | The web has no runtime configuration: the API and the socket are same-origin relative paths, so nothing about the host is compiled into the client. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.15 | A developer needs every tier that has code tested by the tool that understands that tier. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.15 | — | FR.15.1 | Repository and data-access tests run against real Postgres in a disposable container, on the same engine version development runs. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.15 | — | FR.15.2 | Those tests apply the project's own migrations rather than creating tables themselves, so the schema under test is the schema that ships. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.15 | — | FR.15.3 | One database container is started per test project and each parallel worker is isolated by its own schema, so tests neither collide nor start a container each. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.15 | — | FR.15.4 | Web tests fake the network at the network boundary, with fakes generated from the same document the hooks came from, and never by mocking a module. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.15 | — | FR.15.5 | CI runs every check on every change: lint, the dependency boundaries, type-checking, generated-file drift, and all test tiers. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.16 | A player's very first screen needs the finished visual system, so no screen is ever built against provisional styling and redone later. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.16 | — | FR.16.1 | The theme is generated from the design token file, and no component contains a raw colour, size, radius or duration. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.16 | — | FR.16.2 | The app shell renders the top bar specified for a signed-out screen: the wordmark and a standalone language switcher. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.16 | — | FR.16.3 | Both interface fonts load with a declared fallback stack and swap in without a flash of invisible text. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.16 | — | FR.16.4 | English and Portuguese catalogues both ship, typed so that a missing or misspelled key fails the build instead of rendering the key on screen. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.16 | — | FR.16.5 | An error boundary sits at the application root and on every route, so a broken screen never renders as a blank page. | 2026-08-28 |
| Scaffolding | Deployment | UN.17 | An operator needs to run the real deployment on their own machine, so the deployment path is exercised long before any server exists. | — | — | 2026-08-28 |
| Scaffolding | Deployment | UN.17 | — | FR.17.1 | The system ships as two images: the API, and a web image holding the built static files and the proxy configuration. | 2026-08-28 |
| Scaffolding | Deployment | UN.17 | — | FR.17.2 | Neither image contains anything specific to a host. Every difference between one environment and another is an environment variable. | 2026-08-28 |
| Scaffolding | Deployment | UN.17 | — | FR.17.3 | A single command runs both images with Postgres over HTTPS at a local hostname, using a certificate the proxy issues itself. | 2026-08-28 |
| Scaffolding | Deployment | UN.17 | — | FR.17.4 | The proxy serves the web files and forwards the API and the socket on one origin, so there is no cross-origin request anywhere and the session cookie is first-party. | 2026-08-28 |
| Scaffolding | Deployment | UN.17 | — | FR.17.5 | The proxy's certificate authority is kept in a named volume, so tearing down containers does not regenerate it and silently invalidate the certificate the developer trusted. | 2026-08-28 |
| Scaffolding | Deployment | UN.18 | An operator needs moving to a cloud host to be configuration rather than a rebuild. | — | — | 2026-08-28 |
| Scaffolding | Deployment | UN.18 | — | FR.18.1 | The local arrangement and a hosted one are the same two images in the same topology; only DNS, the secret values and where the certificate comes from change. | 2026-08-28 |
| Scaffolding | Deployment | UN.18 | — | FR.18.2 | CI builds both images and publishes them to a registry tagged by commit, so a host can be pointed at an image that already exists rather than at a build pipeline that does not. | 2026-08-28 |
| Scaffolding | Deployment | UN.18 | — | FR.18.3 | Secrets reach a container through its environment and are never read from a file baked into an image. | 2026-08-28 |
| Scaffolding | Deployment | UN.19 | An operator needs a restart or a schema change never to leave the system in a broken state. | — | — | 2026-08-28 |
| Scaffolding | Deployment | UN.19 | — | FR.19.1 | Migrations run as their own step that must finish before the API starts, never as part of booting it. | 2026-08-28 |
| Scaffolding | Deployment | UN.19 | — | FR.19.2 | The API answers a health check that the proxy uses to decide whether to send it traffic. | 2026-08-28 |
| Scaffolding | Deployment | UN.19 | — | FR.19.3 | On a shutdown signal the API refuses new work and finishes what is already in flight rather than dropping it. | 2026-08-28 |
| Scaffolding | Deployment | UN.20 | An operator needs the deployment path to fail loudly here rather than quietly on a server. | — | — | 2026-08-28 |
| Scaffolding | Deployment | UN.20 | — | FR.20.1 | CI stands up the full deployment stack on every change and runs the end-to-end path from UN.10 against it, over HTTPS. | 2026-08-28 |
| Scaffolding | Deployment | UN.20 | — | FR.20.2 | That test obtains the proxy's certificate from the running stack rather than disabling verification, so it exercises the same TLS path a browser will. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.21 | A developer needs to see what the running system is doing — which requests are slow, what threw, where the time goes — without instrumenting a feature after the fact. | — | — | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.21 | — | FR.21.1 | The observability agent is wired at bootstrap from the first commit, so instrumenting is never a later edit to files that have since become stable. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.21 | — | FR.21.2 | The agent activates only when its credentials are present in the environment. Development and CI leave them unset, and it then sends nothing at all. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.21 | — | FR.21.3 | Telemetry leaves the machine to a hosted collector this project does not control. That is a deliberate trade, and FR.21.2 is what keeps it from happening by default. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.21 | — | FR.21.4 | The agent carries traces, runtime metrics and profiles. Log lines are the logger's job and do not travel through it. | 2026-08-28 |
| Scaffolding | Project scaffolding | UN.9 | — | FR.9.7 | `apps/api` holds a fifth module, `system`, beside the four in `FR.9.3` — which this row supersedes. It owns what belongs to the running server rather than to a game system: the `server_meta` read path in `FR.10.2` and the health check in `FR.19.2`. Both are homeless under `FR.9.3`, and app-level code sits outside the boundary check `FR.12.2` runs. | 2026-08-28 |
