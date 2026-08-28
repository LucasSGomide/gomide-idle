# Back-end rules

Rules for anything back-end-shaped. `project.yml` points every
`**Back-end**` bullet in a roadmap item at this file.

These are architecture principles and back-end standards — constraints on code
structure and dependency direction, on how the simulation, the server and the
client are allowed to talk to each other, and on how a use case, a repository,
an error, a log line and a test are written. Functional requirements, user
needs and tuning notes that used to live here have moved to
[`alpha.md`](../alpha.md)'s Functional Requirements, User Needs and Notes
tables.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

Rules 37–42, 45, 48, 67 and 69 were rewritten 2026-08-28 by the **Project
scaffolding** requirements pass, which dropped this project's own `ApiError`
hierarchy, its `ErrorTypeEnum` and its `LoggerPort` in favour of NestJS's
exceptions and `pino-http`. Rule 19 and the Layers header were corrected in the
same pass. Every one of them keeps its number and quotes the text it replaced.

Rules 1–18 were written 2026-08-24; numbering them, on 2026-08-26, was the only
edit to their wording. Rules 19–86 were added on 2026-08-26, adapted from a
personal `backend-standards` skill that lived outside this repository and was
written against MikroORM and another project's domain. That skill is disabled
here and is not coming back — a project's standards belong in the project.

The simulation lives here. Most of what follows exists because
[`alpha.md`](../alpha.md) decision 2 makes offline progress a **replay** of the
live combat code — which turns determinism from a nice property into a
correctness requirement.

## Determinism

1. **Never call `Math.random()` inside the simulation.** Use one seeded PRNG
   whose seed *and call counter* live in the run state.

2. **Pin the PRNG algorithm in your own code, not in a dependency.** A library
   that changes its generator in a minor version silently changes the outcome of
   every run in flight.

3. **Never read the clock inside the simulation.** Time is a parameter passed
   in.

4. **Sort by stable entity id before any loop whose order affects the outcome.**
   Objects and Maps preserve insertion order, but a state rebuilt from JSON
   iterates differently.

5. **Store damage, health and every combat quantity as fixed-point integers,
   never floating point.** Floating point is deterministic on one machine but
   drifts between engines.

6. **Use separate PRNG streams for combat and for loot.** One shared stream
   means adding a single roll to any mechanic silently rerolls every future drop
   in every run in flight.

## Server authority

7. **The server owns state, the clock and the seed; the client sends intent.**
   [`alpha.md`](../alpha.md) decision 4 depends on this.

8. **Never send RNG state to the client.** The seed determines every future
   drop.

9. **`libs/simulation` depends on nothing.** An empty dependency list is the
   only enforcement of the determinism rules above that cannot be forgotten in
   review.

10. **The simulation refers to items by id, never by an item object.** It keeps
    the fight independent of every account-side shape.

11. **Content is data, validated at load — never constants in code.** A new
    monster, item or hunt should be a content edit; only a new *dimension*
    should be a code change.

## Simulation boundary

12. **The simulation has no side effects until one transactional write at the
    end.** It is what makes a lost optimistic-lock race safe to simply re-run.

13. **Simulation state is plain data, and is never persisted.** A run's truth is
    its header — seed, content version, start tick and the frozen character
    snapshot — plus the outcome it banks. The world inside the fight is rebuilt
    by replay and thrown away. The one bounded exception: outcomes and death
    records are stored, because "which element, which monster, which wave" is a
    balance question needing queryable rows.

14. **A live tick and an offline replay are the same call with a different tick
    count.** The moment they are two functions, [`alpha.md`](../alpha.md)
    decision 2 has been abandoned without anyone deciding to.

15. **Project the character into the fight; never write the fight back.** A run
    returns an outcome and a use case applies it — two copies of equipment that
    can disagree is the bug this prevents. A live edit is a fresh projection
    *into* the arena, never a write out of it.

16. **The character sheet is the simulation's modifier collection run with zero
    ticks.** One implementation of "additive within a stat, multiplicative
    between", so the sheet cannot promise a number the fight will not deliver.

17. **A live edit lands on a tick boundary, like any other input.** Gear,
    gambits, skill points and targeting all arrive as intent and take effect on
    the next tick, which keeps one ordering rule rather than four.

18. **Decide where new state goes by asking whether replaying the current run
    from its header reproduces it.** Yes means simulation state. No means it is
    a run input or a banked outcome, and belongs to an aggregate.

## Layers

Added 2026-08-26.

`apps/api` divides into `auth`, `player`, `character` and `hunt`
(`stack-api.md` rule 30). *Corrected 2026-08-28: this named three modules and
that rule grew a fourth, `player`, on the same day — so the doc that defines the
layers listed one fewer module than the doc that defines the modules.* Each of
those is one module with four layers. Two words used below: an
**aggregate** is a domain object that owns its own invariants, and a **port** is
an interface named by the layer that needs it.

19. **Give every module four layers — `domain`, `application`, `infrastructure`,
    `entrypoint` — and let imports point inward only.** It is the one rule that
    keeps a database row type or a socket handle out of a combat rule, and
    inward-only is something a machine can check where "keep it clean" is not.
    *Revised 2026-08-28; the why read "something a lint rule can check", which
    stopped being true when `stack-api.md` rule 40 chose oxlint — it cannot
    express a path-to-path boundary at all. `stack-api.md` rule 42 is the
    mechanism now: dependency-cruiser, as its own check. The imperative is
    unchanged, and so is the claim that it is enforced rather than hoped for;
    only the thing doing the enforcing moved.*

20. **Import nothing from NestJS, Drizzle, Socket.IO or the schema library into
    `domain/`.** Drizzle makes this nearly free — its schemas are plain objects,
    so unlike MikroORM there are no decorators to forget to leave off — which is
    exactly why it has to be written down: nothing about the ORM will remind
    you.

21. **Let the repository be the only thing that crosses the domain/persistence
    boundary, through one `toDomain(row)` and one `toRow(aggregate)`.** Two
    mapping sites means two places to fix when a column moves, and the second
    one is always found later.

22. **Never let a Drizzle inferred row type (`typeof characters.$inferSelect`)
    escape the repository.** It is one `export type` away from becoming the
    domain's shape, and then the schema is designing the aggregate.

23. **Put deployables in `apps/` and shared code in `libs/`, per `stack-api.md`
    rule 30.** That rule already carries the folder split; this one exists so
    the back-end doc points at it instead of growing a second copy that can
    disagree.

24. **Keep `entrypoint/` free of decisions — it maps a request or a socket
    message to a use-case input and maps the result back.** An HTTP controller
    and a socket handler must be able to call the same use case, which is only
    true when neither of them decides anything.

## Use cases

`stack-api.md` rule 4 dropped the command bus, and rule 5 keeps combat events
off any in-process bus. There is no `CommandBus`, `QueryBus` or `EventBus` in
this project and none is coming: a **use case** is one application operation,
and the read/write split that CQRS buys is already bought by rules 30–36 below.

25. **Write one use case per operation, with one public `execute` method taking
    one typed input object.** A single entry point is what lets the HTTP
    entrypoint and the socket gateway share an operation without a second copy
    of its argument list.

26. **Check the shape of an input at the entrypoint and its meaning in the use
    case.** "Is this a UUID" is a parse and belongs at the edge; "may this
    character seal an offline session" is a rule and belongs where the rules
    are. *Revised 2026-08-27: the example was "does this character belong to this
    account", which is no longer checked anywhere.
    [`auth.md`](auth.md) rules 20 and 21 make ownership a property of the load
    instead — every read is scoped by the acting user, so a character that is
    not the caller's is not found rather than refused. The imperative is
    unchanged; only an example that stopped being true was replaced.*

27. **Give a pre-write check that needs a database read its own `@Injectable()`
    validator class.** Inline database checks are what grow `execute` past one
    screen, and the check is the part worth reusing when a second operation
    needs it.

28. **Never let a use case call another use case.** Coordinate the aggregates
    directly instead; a chain of use cases hides where rule 12's single
    transaction begins and ends.

29. **Return data from a use case, never a transport shape.** No status code, no
    socket acknowledgement, no header — the same operation runs on both
    transports and one of them has no status codes at all.

## Repositories and DAOs

A **repository** loads and saves aggregates. A **DAO** — data access object —
runs one read and returns the flat shape its caller wants.

30. **Split persistence in two: a repository writes and returns domain objects,
    a DAO reads and returns the flat shape its caller needs.** Reads outnumber
    writes and almost never want an aggregate; see `naming.md` rule 3.

31. **Put a repository port in `domain/` and a DAO port in `application/`, with
    both implementations in `infrastructure/`.** A port belongs to the layer that
    needs it, not the layer that satisfies it — that is the direction rule 19 is
    protecting.

32. **Prefer a DAO per use case over one broad DAO per table.** A narrow
    interface says what the screen actually needs; a wide one becomes the place
    every new query is added because it is already injected.

33. **Do not write a base repository class.** Drizzle's query builder is already
    the shared implementation, and a generic base with three type parameters
    would exist to deduplicate `(page - 1) * pageSize`. The cost is real — that
    arithmetic will be written more than once. When a fourth reader appears,
    extract a plain function, not a superclass.

34. **Touch the database only from a repository or a DAO.** It is what makes
    "where does this query live" answerable without reading the whole module.

35. **Let the use case open the transaction and pass the handle to the
    repository.** Drizzle has no unit of work, so nothing implicit will group
    two writes for you, and rule 12 requires a run to land in exactly one write.
    The price is a transaction parameter on every write method — that is the ORM
    declining to hide it, not an accident.

36. **Run `stack-api.md` rule 21's advisory lock and status compare-and-swap
    inside that same transaction, in the use case.** `pg_try_advisory_xact_lock`
    is transaction-scoped so it has nowhere else to live, and the swap guards an
    outcome the repository cannot see.

## Errors

Rules 37–42 and 45 were rewritten 2026-08-28, with the **Project scaffolding**
requirements. This project had an `ApiError` hierarchy of its own and an
`ErrorTypeEnum` beside it; both are dropped in favour of NestJS's own exceptions
carrying a machine-readable `code`. The numbers and the reasoning survive — what
changed is the class thrown, and every rule below keeps its old text quoted so a
reader can see which argument was kept and which was bought out.

37. **Sort every error into two categories: an expected one is a NestJS
    `HttpException` subclass carrying a `code` in its body, and everything else
    is a 500.** A third category is where "handled sometimes" lives, and it ends
    up unhandled on one of the two transports. One exception filter normalises
    every HTTP response to `{ statusCode, code, message }`, and rule 45's socket
    filter is its twin — the shape is declared in one place or each transport
    invents its own. *Revised 2026-08-28; this read "expected ones extend
    `ApiError`". The two-category split is unchanged and is the part worth
    keeping; the base class is now the framework's rather than ours.*

38. **Throw a NestJS exception from `application/` or `infrastructure/`, and
    never from `domain/`.** *Reversed 2026-08-28. This rule read "Never throw a
    NestJS exception — `HttpException`, `BadRequestException`, `WsException` —
    from `domain`, `application` or `infrastructure`", because "each one encodes
    a transport, and the same use case runs over both". That objection is real
    and is answered rather than dismissed: rule 45's socket filter reads the
    thrown exception's status and body and emits a frame, so the status code is
    translated at the edge instead of being absent from the throw. What survives
    intact is the half rule 20 already guards — `domain/` imports nothing from
    NestJS, so it throws plain `Error` subclasses of its own and the layer that
    knows a transport exists is the only layer allowed to name one.*

39. **Declare every `code` in one vocabulary in `libs/contracts`, and add a new
    one there before throwing it.** One vocabulary means the client writes one
    error switch instead of one per transport. *Revised 2026-08-28; this read
    "Add every new error `type` to `ErrorTypeEnum`". The enum is gone and the
    reason for it is not: `code` is what `architecture-web.md` rule 27 switches
    on, so a code invented at a throw site and never declared is a code the
    client renders as a generic failure.*

40. **Add a new `code` freely; add a new exception subclass only when the client
    must react differently.** A per-message error class the UI renders
    identically to the last twelve is a class nobody will ever dare delete —
    where a `code` is one entry in rule 39's list and costs nothing to add.
    *Revised 2026-08-28; this read "Create a specific `ApiError` subclass only
    when the client must react differently to it; otherwise throw
    `ValidationError`". The imperative is unchanged; what it applies to is now a
    Nest exception, and the cheap alternative is a code rather than a catch-all
    class.*

41. **Catch the driver error in the repository, match on the SQLSTATE `code` and
    never on the message, log it, then re-throw `InternalServerErrorException`.**
    The `postgres` driver's messages change between versions and are not an API;
    `23505` unique violation, `23503` foreign key violation and `40001`
    serialization failure are. *Revised 2026-08-28: the class thrown was
    `InternalServerError`, ours. Note the collision the rewrite creates and does
    not resolve away — SQLSTATE's field is also called `code`, and so is rule
    39's. They are different vocabularies and one is never assigned to the
    other.*

42. **Translate a SQLSTATE the use case is deliberately racing on into a named
    exception with its own `code` instead.** Two attempts to bring the same
    character online at once (`stack-api.md` rule 21) is an expected outcome, not
    a server fault, and a 500 would tell the player to file a bug. *Revised
    2026-08-28 twice: first with that rule, because the race is at character
    select and not at sign-in; then for rule 37's base class.*

Socket errors. The source material this section was adapted from was entirely
HTTP-shaped, and the main transport here is a socket, so rules 43–47 are new.

43. **Reply to a bad socket message with an error frame addressed to that
    message, never by closing the connection.** The socket is presence
    (`stack-api.md` rule 12) — closing it takes the character out of the world
    and starts the five-second leave, which turns a rejected inventory swap into
    a lost hunt.

44. **Carry a client-generated correlation id on every inbound socket message
    and echo it on the reply.** Without one an error frame arrives at a
    connection rather than at a request, and the client cannot tell which of
    three in-flight intents failed.

45. **Shape the socket error frame as rule 37's HTTP body minus its status
    code, plus the correlation id: `{ correlationId, code, message, children? }`.**
    Same `code` vocabulary as HTTP, so an error is rendered by the same client
    code however it arrived. *Revised 2026-08-28; this read "as an `ApiError`
    minus its status code: `{ correlationId, type, message, children? }`" with
    "Same `ErrorTypeEnum` as HTTP". Both names changed and the shape did not —
    which is the point of the rule and the reason it kept its number.*

46. **Close a socket for exactly three reasons: a failed handshake, a
    protocol-version mismatch, and the deletion of the session that opened it.**
    All three mean nothing the client sends next can be trusted, and
    `stack-web.md` rule 22 already has the client showing a reload screen for the
    second. *Revised 2026-08-28; this rule said "exactly two" and
    [`auth.md`](auth.md) rule 33 needed a third. The stated reason is unchanged —
    a deleted session is precisely the case where nothing further can be trusted
    — it was simply not on the list, which left signing out mid-hunt with no rule
    that allowed it.* The third is the only one the server initiates while
    everything is healthy, so it is also the only one that starts the ordinary
    five-second leave rather than ending a broken connection.

47. **Treat a throw out of `runTicks` as the end of that run, logged with the
    run header.** The header is the entire reproduction — seed, content version,
    start tick, frozen character — so a crash becomes a replayable bug report
    rather than a mystery.

## Logging

`stack-api.md` rule 3 chose Fastify because of rule 52 below, so this section is
load-bearing rather than housekeeping.

48. **Inject a logger; never construct one inside a class and never call
    `console`.** A logger built in place cannot be handed the request or
    connection context, so its lines are exactly the ones missing when you need
    them. *Revised 2026-08-28; this read "Inject a `LoggerPort`". There is no
    port — `stack-api.md` rule 45 registers `pino-http` in Fastify's `onRequest`
    hook and the logger reaches a class through the framework's own injection.
    The imperative is the part that mattered and it is untouched: the ban is on
    constructing, not on any particular interface.*

49. **Pass context as a structured object, never interpolated into the
    message.** `error('Failed to save character', { characterId })` is
    queryable; the same text with the id spliced in is a grep.

50. **Keep `timestamp`, `level`, `module`, `message` and the correlation id at
    the top level of a log line and put everything else under `context`.** A
    fixed top level is what makes one query work across every package.

51. **Never log a password, token, session id or e-mail address.** A log is the
    copy of a credential that nobody remembers to rotate.

52. **Initialize the HTTP log context in Fastify's `onRequest` hook.** It is the
    only place that runs before every handler, and it is why `stack-api.md` rule
    3 picked Fastify.

53. **Initialize a socket's log context once at the handshake, and open a
    message-scoped child context per inbound message.** A socket has no
    per-request hook and a connection lives for hours (`stack-api.md` rule 12),
    so a field written into the connection context follows every later message —
    connection identity belongs on the connection, message identity does not.

54. **Never log inside the tick loop.** At a fixed tick rate one line per tick is
    tens of thousands of lines per player-hour; log the run's boundaries and
    summarize from the event stream it returned.

55. **Use `debug` for development detail, `info` for the start and end of
    meaningful work, `warn` for a handled surprise, and `error` only where an
    operation failed — always passing the error object.** Without the object
    there is no stack trace, and the line then says only that something failed
    somewhere.

## The contract: schemas, the spec and socket messages

One schema per payload, three consumers: request validation on the server, the
OpenAPI document Orval reads, and the socket message types. The alternative —
class-validator decorators — is the thing NestJS 12 ends, so writing them now is
writing a migration.

56. **Define one schema per payload in `libs/contracts` and feed all three
    consumers from it.** Three hand-kept copies of a payload drift, and the copy
    that drifts silently is the socket one, because nothing generates from it.

57. **Use Zod 4 as the only validation library in the repo, `libs/content`
    (`stack-api.md` rule 31) included.** It is Standard Schema compliant so
    NestJS 12's `@Body`/`@Query`/`@Param` take it directly — *confirmed
    2026-08-28: this read "will take it directly", written while v12 was a
    preview, and it is the anticipation that `stack-api.md` rule 2 cites as the
    reason for moving to it*; `z.infer` gives
    the socket message types with no second declaration; and `z.toJSONSchema()`
    is built in, which is the step Orval's input actually needs and the one the
    alternatives make you install a second package for.

58. **Never write a `class-validator` or `class-transformer` decorator.**
    `stack-api.md` rules 1, 2 and 33 all exist to avoid writing code whose
    scheduled job is to be migrated off, and this is that code.

59. **Treat the OpenAPI document as a build output, never a file anyone edits.**
    It is the input to Orval's client and TanStack Query hooks (`stack-web.md`
    rule 2), so an edit made there is lost on the next build, silently.

60. **Give every enum an explicit schema name in the spec.** Orval names an
    anonymous inline enum after its position, so two of them collide and one
    quietly wins.

61. **Register every error a route can return in that route's OpenAPI
    responses.** Orval generates the client's error type from it, so an
    unregistered error reaches the client as `unknown` and gets rendered as a
    generic failure.

62. **Add `libs/contracts` as a third shared package alongside `libs/simulation`
    and `libs/content`.** `stack-api.md` rule 30 names two because the socket
    message types had no home yet; the web client and the API must import the
    same schema object, and neither existing package can hold it without taking
    a dependency it is not allowed to have.

Whether socket messages are validated or merely typed was the one genuinely
open question in this pass. Settled 2026-08-26 as a split, because the two
directions have nothing in common: inbound messages are untrusted and rare,
the outbound tick stream is ours and constant.

63. **Validate every message the server receives on the socket against its
    `libs/contracts` schema.** An equip, a reorder or a hunt entry is untrusted
    input arriving a few times a minute, so holding it to a weaker standard than
    an HTTP body buys nothing measurable.

64. **Do not validate the per-tick arena event stream — type it and version
    it.** A parse per event is a cost paid at the tick rate forever, the stream
    is produced by our own `runTicks`, `architecture-web.md` rule 4 keeps it out
    of React state entirely, and `stack-web.md` rule 23's exhaustive `never`
    switch already fails the build on a shape the client does not know.
    *Citation repointed 2026-08-27; this rule cited `stack-web.md` rule 17,
    which became a pointer to that rule when the boundary moved to one file.*

65. **Validate a socket push on the client before it enters the TanStack Query
    cache.** `stack-web.md` rule 5 writes those payloads straight in, and
    `stack-api.md` rule 15's version integer catches a stale client but not a
    server that changed a payload without bumping it — a wrong shape in the
    cache surfaces three screens away from the bug.

## What does not apply to `libs/simulation`

A standard that does not apply somewhere has to say so, or someone will apply
it. `libs/simulation` is one pure function and its data.

66. **Rules 19–36 do not apply to `libs/simulation`: no layers, no ports, no DI
    and no NestJS (`stack-api.md` rule 7).** A port would be a seam between a
    package and itself, and the determinism suite must run without booting a
    framework or it will eventually be skipped.

67. **`libs/simulation` never logs — no injected logger, no `console`.** Logging
    inside the tick loop is a side effect in a package whose determinism is a
    correctness requirement, and rule 9's empty dependency list leaves nothing
    to inject a logger through. The caller logs from the event stream the run
    returns.

68. **`libs/simulation` takes no schema-validation dependency and validates
    nothing.** Its inputs are already checked before they reach it — content at
    load by `libs/content` (rule 11), intent at the socket edge by rule 63 — and
    rule 9's empty dependency list is the enforcement of every rule above it.

69. **`libs/simulation` throws plain `Error`, never a NestJS exception.** A
    framework exception would end rule 9's empty dependency list — the one thing
    enforcing every determinism rule above it — and rule 47 already says what the
    caller does with the throw. *Revised 2026-08-28; this read "never `ApiError`",
    whose home was `libs/contracts`. The class changed and the boundary did not:
    what this package may not import is anything, and that includes whatever the
    errors are made of this week.*

## Testing

Jest, per `stack-api.md` rule 32. A **fixture** below is a fixed input value a
test asserts against.

70. **Build the subject under test in a `makeSut()` factory returning
    `{ sut, ...fixtures }`, and do not make it configurable.** A test that
    reconfigures its own setup hides which dependency the assertion actually
    rests on.

71. **Structure a unit test as `describe('<methodName>')` → `it('should …')`,
    with `jest.clearAllMocks()` in `beforeEach`.** Method-shaped tests are how
    you find the missing case by reading the file's headings.

72. **Use `'any-<fieldName>'` for string fixtures and real UUID values for id
    fixtures.** A string id passes a unit test and fails a `uuid` column, which
    leaves the integration test to find a bug the unit test invented.

73. **Prefer `jest.spyOn` on a real instance over an `as unknown as Type`
    cast.** A cast keeps compiling after the real signature changes; a spy does
    not.

74. **Do not mock a value object or an entity the aggregate builds itself — mock
    only injected dependencies.** Mocking the subject's own parts is how a green
    suite survives a broken constructor.

75. **Give every aggregate a `<name>.mock.ts` factory in its `test/` folder,
    taking `Partial<…PropsType>` overrides and returning a named object.**
    Returning `{ mockCharacter }` rather than the aggregate means adding a second
    fixture later does not touch every call site.

76. **Export factory functions from a `.mock.ts` file, never constants, and
    return a fresh copy per call.** A shared constant that one test mutates is
    the hardest red build to explain.

77. **Write no comments in test files, except to explain a `@ts-expect-error`.**
    The reason a test deliberately passes an invalid input is the one thing the
    code cannot show.

78. **Test an HTTP entrypoint through `app.inject()` on a booted Fastify app,
    never by calling the controller method.** The routing, the guard and the
    schema parse are the parts being tested, and none of them run on a direct
    call.

79. **Test the one-character-online claim (`stack-api.md` rule 35) with two
    connections opened in the same tick, through real clients.** A sequential
    test passes against a broken implementation, because the bug being hunted is
    an `await` between the check and the write.

80. **Run repository and DAO tests against real Postgres in Testcontainers, on
    the engine version `stack-api.md` rule 25 pins.** A repository tested
    against a fake proves the fake works, and the schema is half of what is
    under test.

81. **Apply the `drizzle-kit` migrations to the test container rather than
    creating tables in the test.** `stack-api.md` rule 17 makes the migrations
    the schema's only definition, so a test that builds its own tables is
    testing a schema that never ships.

82. **Give each integration test file its own seed factory in
    `test/<name>.mock.ts`, taking explicit ids, and never share one across
    files.** A shared factory becomes a fixture nobody can change, because four
    unrelated files assert on its defaults.

83. **Use a distinct account and character id per scenario, and verify a write by
    querying the database directly rather than through the subject.** A
    repository that reads back its own bad write consistently will pass its own
    test.

84. **Run `stack-api.md` rule 11's four determinism tests as their own Jest
    project, separate from the API tests.** Booting a database for tests that
    need no I/O is how a fast suite becomes a slow one and then a skipped one.

85. **Commit the golden hash as a file, and make `canonicalJson` sort keys
    recursively.** Without the recursive sort every test in that suite passes
    for the wrong reason.

86. **Test `libs/simulation` by constructing it directly — no NestJS testing
    module, no DI container, no mocks.** There is nothing to inject (rule 66);
    a pure function's test is an input and an expected output.

## Content and language

Added 2026-08-26. `stack-web.md` rules 48–52 ship the client in English and
Portuguese, and rule 51 takes a hunt, monster, skill or affix name from the
content pack rather than from the client's catalogues — which made the pack's
shape a back-end question that nothing here had answered.

87. **Keep a content name as one authored English string; the content pack holds
    no per-language field and no locale map.** A monster is called the same thing
    in both languages, so a name means one thing in chat, in a wiki page and in a
    bug report, and rule 11's promise holds unchanged — adding a monster stays a
    single content edit rather than a content edit plus two catalogue files in
    another package. The price is on screen and is deliberate: a Portuguese
    player reads "Você morreu para o chefe de Ashfen Ruins", with an English
    proper noun inside a Portuguese sentence. The second price is the exit — if
    this is ever reversed, every existing name becomes a migration, because a
    plain string has no room to put the second language in.

88. **Translate the chrome, never the content: a string the developer wrote is
    `stack-web.md` rule 48's catalogue, a string an author wrote is the content
    pack.** The two are edited by different people at different times, and the
    split is what keeps `libs/content` free of an i18n dependency and the
    catalogues free of game data. The line to watch is a description rather than
    a name — a hunt's blurb or a skill's tooltip text is authored *and* wants
    translating, and nothing in the alpha has one yet, so the day one appears
    this rule is what has to be revisited rather than worked around.

## Where auth reaches in

Added 2026-08-27, when [`auth.md`](auth.md) was written from an empty stub. Both
rules below are auth rules that constrain shapes this file owns, so they are
numbered here and stated there — never both.

89. **See [`auth.md`](auth.md) rules 20 and 21: every repository and DAO method
    that reaches account-owned data takes the acting user's id, and there is no
    unscoped find-by-id.** It reads like a persistence rule and is an
    authorization one — it is what makes ownership impossible to forget rather
    than a check somebody remembers — but the signatures it constrains are rules
    30–34's, so a reader adding a DAO needs to meet it here.

90. **See [`auth.md`](auth.md) rules 5–7: Better Auth's generated tables hold no
    product data, and a player's own settings live on the `player` module's
    `player_account`, keyed by the Better Auth user id.** Rule 22 already refuses
    to let a Drizzle row type become the domain's shape; this is the same boundary
    drawn around a schema file the project does not write, and the reason a new
    column does not go in the obvious place. *Revised 2026-08-28: the table was
    `user_preference` and had no owning module until `stack-api.md` rule 30 grew a
    fourth.*
