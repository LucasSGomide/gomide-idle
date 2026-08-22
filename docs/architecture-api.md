# Back-end rules

Rules for anything back-end-shaped. `project.yml` points every
`**Back-end**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

The simulation lives here. Every rule below exists because
[`alpha.md`](../alpha.md) decision 2 makes offline progress a **replay** of the
live combat code — which turns determinism from a nice property into a
correctness requirement.

1. **Never call `Math.random()` inside the simulation.** Use one seeded PRNG whose
   seed *and call counter* live in the run state, or a replay cannot resume
   mid-stream and every offline result is unreproducible.

2. **Pin the PRNG algorithm in your own code, not in a dependency.** A library
   that changes its generator in a minor version silently changes the outcome of
   every run in flight.

3. **Never read the clock inside the simulation.** Time is a parameter passed in;
   a simulation that reads `Date.now()` produces a different result on every run
   and cannot be replayed.

4. **Sort by stable entity id before any loop whose order affects the outcome.**
   Objects and Maps preserve insertion order, but a state rebuilt from JSON
   iterates differently — and tile reservation is decided by iteration order.

5. **Store damage, health and every combat quantity as fixed-point integers.**
   Floating point is deterministic on one machine but drifts between engines, so
   integers remove the entire class of bug if the simulation ever runs in two
   places.

6. **Assert that a repeated seed produces a byte-identical event stream, in CI.**
   It is twenty lines and it is the only test that catches nondeterminism before
   a player does.

7. **Fix the tick rate once and treat it as permanent.** It is baked into every
   replay, so changing it changes the outcome of every run in flight.

8. **Write a run header's migration in the same commit as the shape change that
   needs it.** A migration written later is a migration written against a shape
   you no longer remember — and per rule 18 the header is the only thing left
   that a migration can even apply to.

9. **Never send RNG state to the client.** The seed determines every future drop,
   so leaking it lets a player read the boss's loot before the fight.

10. **Cap how much elapsed time a single catch-up will replay.** Without a cap, a
    player returning after six months times out the request on login.

11. **Persist the seed and the inputs for each hunt.** It makes "why did my
    character die at 3am" answerable by replaying that exact hunt, rather than by
    guessing.

12. **Content is data, validated at load — never constants in code.** A new
    monster, item or hunt should be a content edit; only a new *dimension* should
    be a code change.

13. **Validate content for referential integrity, not just shape.** Every skill,
    prefix and monster a table names must exist, or the failure surfaces as a
    crash mid-hunt instead of at boot.

14. **The server owns state, the clock and the seed; the client sends intent.**
    [`alpha.md`](../alpha.md) decision 4 — replay-based offline is impossible
    otherwise.

15. **`libs/simulation` depends on nothing.** An empty dependency list is
    the only enforcement of rules 1–5 that cannot be forgotten in review.

16. **Use separate PRNG streams for combat and for loot.** One shared stream means
    adding a single roll to any mechanic silently rerolls every future drop in
    every run in flight.

17. **The simulation has no side effects until one transactional write at the
    end.** It is what makes a lost optimistic-lock race safe to simply re-run.

18. **Simulation state is plain data, and is never persisted.** A run's truth is
    its header — seed, content version, start tick and the frozen character
    snapshot — plus the outcome it banks. The world inside the fight is rebuilt
    by replay and thrown away, so it needs neither an aggregate's invariants nor
    a migration.

19. **A live tick and an offline replay are the same call with a different tick
    count.** The moment they are two functions, [`alpha.md`](../alpha.md)
    decision 2 has been abandoned without anyone deciding to.

20. **Offline hunting is a mode the player enters deliberately.** A sealed session
    is replayed exactly once, at the next login, which is what stops catch-up
    cost from growing with every logout.

21. **A dropped socket ends the live hunt and banks what it earned.** Anything
    else makes the server guess whether closing a tab was intent.

22. **Freeze the character's equipment, skill levels and rule list into the run
    header when a run starts.** It is what keeps rule 11's "replay that exact
    hunt" true after the player re-gears.

23. **The simulation refers to items by id, never by an item object.** It is what
    keeps the fight independent of every account-side shape.

24. **Project the character into the fight; never write the fight back.** A run
    returns an outcome and a use case applies it — two copies of equipment that
    can disagree is the bug this prevents.

25. **The character sheet is the simulation's modifier collection run with zero
    ticks.** One implementation of "additive within a stat, multiplicative
    between", so the sheet cannot promise a number the fight will not deliver.

26. **Loot resolves straight into the inventory; nothing is ever an item on the
    ground.** No item entity, no pickup phase and no despawn timer, until a
    feature actually needs spatial loot.

27. **Decide where new state goes by asking whether replaying the current run
    from its header reproduces it.** Yes means simulation state. No means it is a
    run input or a banked outcome, and belongs to an aggregate.
