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

Rules 7–12 were added 2026-08-26, moved out of `architecture-api.md` when the
back-end standards were written there — that doc keeps the port, repository and
DAO *structure* and cites this one for what things are called.

7. **Suffix every port interface with `Port`: `CharacterRepositoryPort`,
   `GetInventoryDaoPort`.** Rule 2 already puts `.port.ts` on the file; the type
   name has to say it too, because the import site is where the mistake —
   depending on the implementation instead of the interface — actually gets made.

8. **Declare a data shape as `type FooType = { … }`, never a bare
   `interface Foo { … }`.** The suffix tells you at the import site that this is
   a shape and not a behaviour, and two `interface` declarations of one name
   merge silently where two `type` aliases collide loudly.

9. **Name a use case's input `<Verb><Resource>InputType`.** `stack-api.md` rule 4
   dropped the command bus, so `CreateCharacterCommand` would name a mechanism
   that is not there; rule 1 already named the use case and the input just
   follows it.

10. **Name a repository implementation `<Entity>Repository` in
    `infrastructure/database/repository/<entity>.repository.ts`, and a DAO
    `<Verb><Resource>Dao` in
    `infrastructure/database/dao/<verb>-<resource>.dao.ts`.** The ORM does not
    appear in the name: the folder already says this is the adapter, there is
    exactly one adapter per port, and this project swapped ORM once before
    writing a line of code — `*.mikro-orm.repository.ts` would already have been
    a rename.

11. **Name a Drizzle table for its singular `snake_case` table name and export it
    as the plural camelCase symbol — `export const characters = pgTable('character', …)`
    — in `infrastructure/database/schema/<entity>.schema.ts`.** A join reads
    singular and a `select` reads plural, and settling it once is worth more than
    either convention is on its own.

12. **Name an injection token in `SCREAMING_SNAKE_CASE` after the port it
    satisfies: `CHARACTER_REPOSITORY`, `GET_INVENTORY_DAO`.** A port is a type
    and disappears at runtime, so the token is the only thing DI can see — and a
    token that does not match its port is the one mismatch the compiler cannot
    catch.
