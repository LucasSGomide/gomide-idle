# Goal: Adapt the disabled `backend-standards`, `unit-tester` and `db-integration-test` skills into gomide_idle's own back-end standards, and retire every rule that delegates to them

**Status:** executed 2026-08-26 — `docs/architecture-api.md` numbered and extended to 86 rules, `docs/naming.md` extended to 12, `stack-api.md` rules 6 and 32 rewritten, research citations repointed
**Rating:** —
**Run:** standalone, but must run before any back-end code is written — these are the standards that code will be judged against

## Context

I am building **gomide_idle**, a browser idle RPG. The back-end is NestJS 11 on Fastify,
TypeScript, ESM, Postgres with Drizzle, Better Auth, in a pnpm monorepo. **There is zero
application code so far.** These standards are being written *before* the code they govern,
not extracted from code that already exists — so there is no legacy to accommodate, and no
excuse for a rule that exists only because something was already built that way.

I used to rely on three personal Claude skills for this: `backend-standards`, `unit-tester`
and `db-integration-test`. **I have disabled all three for this project and will not
re-enable them.** They are good material and I want them used as the base — but as a
*reference to adapt*, not a dependency to restore.

Three reasons they cannot simply be switched back on:

1. **They live outside the repo.** They sit in my global Claude config at
   `~/.claude/skills/`, so nothing in this repository can rely on them being present. A
   project's standards have to be in the project.
2. **They are written for a different project.** Three of the reference files are titled
   "Sustell Reference" and carry that project's domain vocabulary and helpers.
3. **They encode MikroORM concretely** — `BaseMikroOrmRepository`, `EntityRepository`,
   `em.getRepository()`, `*.mikro-orm.repository.ts` filenames, Testcontainers integration
   tests keyed to MikroORM. This project switched to Drizzle on 2026-08-26
   (`stack-api.md` rule 17). The port/adapter *architecture* survives an ORM swap
   untouched; the base classes and file naming do not.

Two rules in `docs/stack-api.md` currently delegate to the missing skill and are therefore
broken:

- **Rule 6** — "Keep every other rule in the `backend-standards` skill", covering layering,
  ports, repository mapping, the `ApiError` hierarchy and `LoggerPort`.
- **Rule 32** — "Jest everywhere... the `backend-standards` testing rules are already
  written against Jest." It asserts a test runner on the authority of a document that is no
  longer in play.

There is also a **dangling citation**: `docs/research/api-stack-2026-08.md` refers to
"`architecture-api.md` rule 4", but `docs/architecture-api.md` is unnumbered prose — one
rule per paragraph, no numbers at all. That citation currently points at nothing.

Several decisions are already settled and are **not open for re-argument**; they are listed
as constraints below. What I want out of this prompt is the standards themselves: complete
enough that I can sit down and write the first use case, the first repository and the first
test without guessing, and without reaching for a skill that is not there.

## Constraints

1. **Read the source material before writing anything.** `~/.claude/skills/backend-standards/SKILL.md`
   and its `references/{architecture,commands,errors,logging,openapi,repository-dao,testing}.md`,
   plus `~/.claude/skills/unit-tester/` and `~/.claude/skills/db-integration-test/`. Also read
   `docs/stack-api.md`, `docs/architecture-api.md`, `docs/naming.md`, `docs/stack-web.md` and
   `docs/research/api-stack-2026-08.md` — several decisions below are already argued there.

2. **The standards live in `docs/architecture-api.md`.** Extend that file. Do not create a
   new doc and do not add a new area key to `project.yml`; **Back-end** already points there.

3. **Number `docs/architecture-api.md` as part of this pass.** It is currently unnumbered
   prose and something already cites it by rule number. Number the existing rules first,
   preserving their current wording and order, then append the new ones. After this pass the
   numbering is permanent and append-only, exactly as in `stack-api.md` — roadmap items cite
   rules by number and renumbering breaks the citations. Fix the dangling
   "`architecture-api.md` rule 4" citation in `docs/research/api-stack-2026-08.md` to point
   at whatever that rule actually became.

4. **Rewrite `stack-api.md` rules 6 and 32 so neither mentions the skill.** Rule 6 should
   point at the new sections of `architecture-api.md`. Rule 32 keeps Jest — that is settled
   — but must be re-justified on its own terms rather than on the missing skill's authority.
   Amend the text in place and mark the revision inline, the way rules 12 and 17 were; do not
   renumber.

5. **Apply this disposition per source file. It is settled — implement it, do not re-open it.**

   | File | Disposition |
   | --- | --- |
   | `architecture` | Keep and adapt. Note that the domain/persistence split gets *easier* with Drizzle, whose schemas are plain objects — "zero ORM decorators in the domain" becomes free rather than a discipline. Its monorepo section duplicates `stack-api.md` rule 30; cite that rule instead of restating it. |
   | `repository-dao` | Keep the shape, rewrite the implementation. Ports, the repository/DAO split (repository writes and returns domain objects, DAO reads and returns flat shapes) survive intact. `BaseMikroOrmRepository` does not — decide honestly whether a `BaseDrizzleRepository` earns its place or whether Drizzle's query builder makes a base class unnecessary. Naming rules move out; see constraint 8. |
   | `errors` | Keep and adapt. The `ApiError` hierarchy stays. Rewrite the ORM-error-catching section for Drizzle and the `postgres` driver's error codes. **Fill the gap:** the whole file is HTTP-shaped, but the main transport is a socket, and there is no story for what an error over a socket looks like. Write one. |
   | `logging` | Keep and adapt. `LoggerPort` stays — `stack-api.md` rule 3 chose Fastify *because* these logging rules assume its `onRequest` hook, so this material is already load-bearing. **Fill two gaps:** a socket has no per-request hook, so per-connection log context needs its own answer; and `libs/simulation` must not log at all (see constraint 9). |
   | `testing` | Keep and adapt, on Jest. Drop the `MetadataDefaultsMap` helper — that is Sustell's domain. Rewrite the DB integration seed factory for Drizzle. **Fill two gaps:** `stack-api.md` rule 11's determinism suite (same seed twice, chunked resume equality, a committed golden hash, a JSON round-trip mid-stream) has no counterpart in the source material, and neither does testing a framework-free package. |
   | `commands` | Drop the command bus. `stack-api.md` rule 4 chose use cases and constraint 7 keeps it that way. Salvage two things: the application-layer validator idea, which is transport-agnostic, and the handler conventions reframed as use-case conventions — one typed input object per use case, where validation sits, what it returns. Record rule 4 as the reason the rest went. |
   | `openapi` | Keep the spec, change its source. See constraint 6. |

6. **The OpenAPI spec stays, because it is a code-generation source rather than
   documentation.** `@nestjs/swagger` produces a spec, Orval generates a type-safe client and
   TanStack Query hooks from it, and `stack-web.md` rule 2 already puts TanStack Query in
   charge of everything the server owns. But the contract itself is **schemas in a shared
   `libs/` package, not class-validator decorators.** One schema per payload, feeding three
   consumers: request validation on the server, the OpenAPI spec Orval consumes, and the
   socket message types. The reason is `docs/research/api-stack-2026-08.md`: NestJS v12 adds
   Standard Schema support to `@Body`/`@Query`/`@Param`, "ending the class-validator
   dependency" — so decorators are the thing that gets migrated off, and rules 1, 2 and 33
   all exist to avoid writing exactly that. Note that `libs/content` also needs a validator
   (rule 31); prefer one validation library across the repo rather than two.

7. **Rule 4 stands: no `@nestjs/cqrs`.** The read/write split is already achieved by the
   repository/DAO pair, and a DTO per operation needs no library — a use case takes one typed
   input object, and whether it is named `CreateCharacterCommand` or `CreateCharacterInput`
   is naming, not architecture. Do not introduce a `CommandBus`, `QueryBus` or `EventBus`;
   `stack-api.md` rule 5 would then have to police the last of those against combat events
   forever.

8. **Code-naming conventions move to `docs/naming.md`** — the `Port` suffix, `type FooType`
   over a bare `interface`, and the file-naming scheme, which must be re-derived for Drizzle
   since `*.mikro-orm.repository.ts` no longer applies. The back-end doc keeps the port,
   repository and DAO *structure* and cites `naming.md` for what things are called.

9. **State the `libs/simulation` exemptions explicitly, as rules rather than as an aside.**
   No NestJS, no decorators, no DI (`stack-api.md` rule 7); no logging, because logging inside
   the tick loop is a side effect in a package whose determinism is a correctness requirement;
   and no schema-validation dependency, because its dependency list is deliberately empty. A
   standard that does not apply there must say so, or someone will apply it.

10. **Strip the other project's vocabulary.** No "Sustell", no `MetadataDefaultsMap`, no
    domain examples borrowed from it. Where an example helps, use this project's own nouns —
    character, hunt, item, skill, rule list.

11. **Do not invent rules for code that does not exist.** Every rule must trace to something
    real in `alpha.md`, `stack-api.md`, `architecture-api.md` or the requirements table. A
    rule with no why is a preference, and this project's rule docs say so in their own header.

12. **Match the existing house style.** One imperative, one line of why, numbered, append-only.
    Read `stack-api.md` for the voice before writing.

13. **One decision is genuinely open — settle it and record the reasoning.** Whether socket
    messages are *validated* on receipt or merely *typed*. Validating means a protocol
    mismatch fails loudly at the edge instead of corrupting the TanStack Query cache
    (`stack-web.md` rule 5 writes socket payloads straight into it). Not validating costs
    nothing per message, which matters at a fixed tick rate. Weigh it against
    `stack-api.md` rule 15's integer protocol version, which already catches a stale client
    but not a wrong payload, and pick one.

14. **Run `make roadmap-check` when done** and leave it passing.

## Tone

The voice these docs already use: plain words, short sentences, one idea each. Say "the
parsing code", not "the anti-corruption layer". Where a real term of art is the right name —
port, aggregate, use case — use it once and define it in four words. Assume the reader knows
TypeScript and backend architecture well and knows this project's game mechanics not at all.

No hedging and no both-sidesing. Where a rule has a real cost, name the cost in the same
breath as the rule rather than omitting it.

## Output

Edits in place, no new planning docs:

- `docs/architecture-api.md` — numbered, then extended with the adapted standards. This is
  the main deliverable.
- `docs/naming.md` — the code-naming conventions from constraint 8.
- `docs/stack-api.md` — rules 6 and 32 rewritten in place, revisions marked inline.
- `docs/research/api-stack-2026-08.md` — the dangling rule-4 citation repaired.

Finish with a short summary of what was dropped and why, so the decisions in constraint 5
are recoverable later without re-reading the source skills — and call out anything in the
source material that you judged did not earn its place, even where this prompt told you to
keep it.
