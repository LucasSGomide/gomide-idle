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
