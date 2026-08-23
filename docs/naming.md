# Naming rules

Rules for anything naming-shaped. `project.yml` points every
`**Naming**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.


1. **An application-layer operation is a use case: `<verb>-<resource>.use-case.ts`
   exporting `<Verb><Resource>UseCase`.** This project dropped the command bus, so
   `Command`/`CommandHandler`/`Query`/`QueryHandler` names would describe a
   mechanism that is not there.

2. **Keep the `.port.ts` suffix for every repository and DAO interface.** It is
   already the convention in the backend standards, and dropping the bus changed
   the caller, not the boundary.

3. **Repositories serve use cases that write; DAOs serve use cases that read.**
   The split survives the loss of the command/query buses because it was always
   about return shape — aggregates versus whatever the screen needs.

4. **Name packages in full: `libs/simulation`, never `libs/sim`.** The
   abbreviation reads as jargon to anyone who has not built a game, and the
   package name is the word every other doc uses for the thing.

5. **A hunt run's stored row is its *header*, and the word is reserved for it.**
   It names the inputs a run was sealed with — seed, content version, start
   tick, frozen character — and never the world inside the fight, which is not
   stored at all.

6. **`Hunt` is the content, `Arena` is the live room, `Run` is one player's stint
   in it.** Three things with three lifetimes wore one word; splitting them is
   what stops "the hunt" meaning a JSON file in one function and an in-memory
   room in the next.
