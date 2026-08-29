# Goal: Decide and close the eight findings the README pass turned up — three places the repo contradicts itself, two observability decisions that must be made before the agent is ever switched on, one deferral to record, and two tooling calls

**Status:** not executed
**Rating:** —
**Run:** after [`11`](11-rewrite-the-readme-as-the-repo-guide.md). Every finding
below came out of that pass. Nothing else depends on this one.

## Context

Prompt `11` rewrote `README.md` by reading the whole repo. Reading the whole repo
turns up things nobody was looking for. Eight of them are worth closing, and none
of them was fixed at the time, because a documentation pass is the wrong place to
change behaviour.

They are not all the same kind of problem. Three are **contradictions** — a
comment or a rule says one thing and the code does another, and one of the two is
simply wrong. Two are **unmade decisions** about the observability agent, and both
have to be settled *before* anyone puts real credentials in `.env`, because after
that the wrong default is already sending data. One is a **deferral** that only
needs its trigger written down. Two are **tooling calls** where either answer is
defensible and the point is to pick one on purpose.

The reader and decider here is Lucas. He is a strong backend engineer with no
game-development background and no memory of the reasoning behind these files.
Every finding below must be explained to him well enough that he can make the
call himself — not summarised well enough that he can rubber-stamp yours.

**Three things were already fixed in the `11` session.** Do not re-raise them:

1. `make db-studio` failed outright — `apps/api/drizzle.config.ts` declared no
   `dbCredentials`. It now loads the repo-root `.env` and declares the URL.
2. `design-tokens.json` moved from `docs/` to `apps/web/`, where its only
   consumer lives. `docs/design.md` and `docs/stack-web.md` rules 45 and 54
   followed it.
3. The README's server-meta mermaid diagram would not render. A semicolon inside
   a `Note` is a mermaid statement separator, so the note truncated and the rest
   of the diagram was a parse error.

---

### The findings

**Group A — the repo contradicts itself today.** Somebody reading these files
learns something false. Fix all three.

**A1. A stale comment says the socket handshake is unauthenticated. It is not.**

[`libs/contracts/src/socket.schema.ts`](../../libs/contracts/src/socket.schema.ts)
says, above `socketHandshakeSchema`:

> Unauthenticated for now (decided 2026-08-28): no session, no credential.

[`apps/api/src/modules/system/entrypoint/system.gateway.ts`](../../apps/api/src/modules/system/entrypoint/system.gateway.ts)
reads the session from the cookie in `handleConnection`, and refuses a
sessionless handshake with a `NO_SESSION` error frame followed by a disconnect.

The code is right. The comment is left over from before roadmap item `03` closed
that hole. Fix the comment, and check whether anything else — `docs/auth.md`,
`docs/stack-api.md`, roadmap `03` — still repeats the old claim.

**A2. `stack-api.md` rule 39 names a package the repo does not use.**

Rule 39 in [`docs/stack-api.md`](../stack-api.md) names `@nestjs/throttler` as
the rate limiter.
[`apps/api/src/modules/auth/entrypoint/sign-in-throttle.ts`](../../apps/api/src/modules/auth/entrypoint/sign-in-throttle.ts)
is a hand-written in-process sliding-window guard instead, and its own comment
explains why at length: `@nestjs/throttler` 6.5.0 is CommonJS-only, declares a
peer range of `@nestjs/common <=11` against this repo's NestJS 12, and its
`require()` of NestJS 12's ESM build throws under Jest's
`--experimental-vm-modules` loader, which fails every integration suite.

The package is not installed. Rule 39 must be revised to describe what is
actually there, keeping the reasoning the source file already worked out.

**A3. `.env.example` never says where telemetry would go.**

[`.env.example`](../../.env.example) declares `OBSERVE_ENDPOINT=` with an empty
value and no note. `apps/api/src/config/env.ts` treats an empty optional variable
as absent, and `@nestjs/observe` then falls back to its own default,
`https://observe-api.nestjs.com`. A reader who sets the key and secret cannot
tell from this file where their data is being sent.

---

**Group B — decide before the observability agent is ever switched on.** Both of
these are live the moment `OBSERVE_APP_KEY` and `OBSERVE_APP_SECRET` are set.
After that, the default has already happened.

**B1. `sourceContext` defaults to on, and it ships source code.**

`@nestjs/observe`'s `sourceContext` option defaults to `true`. With it on, the
agent reads the machine's own files around each in-app stack frame and attaches
those lines to captured errors, so an error can be shown with the code that threw
it. Its own type documentation says plainly that this ships fragments of your
source to the Observe server, where they are stored alongside the error.

[`apps/api/src/observability/observability.ts`](../../apps/api/src/observability/observability.ts)
does not set it either way. So today the answer is "yes, by accident".

This is a yes or no, and it wants to be on purpose. Frames inside `node_modules`
and Node internals are never read — application source is.

**B2. Traces cannot be attributed to a build.**

`ObserveModule.forRoot` accepts `serviceVersion`, described as a way to tell
versions of a service apart — a semantic version or a commit hash.
`observability.ts` never passes it.

`BUILD_ID` is already validated in `apps/api/src/config/env.ts`, already defaults
to `dev` locally, already carries a git sha in CI, and is already reported on
`GET /server-meta`. The value exists and is already trusted for exactly this job
somewhere else.

---

**Group C — not now, but write down when.**

**C1. `OBSERVE_SERVICE_ID` is one fixed string.**

It defaults to `tormented-path-api`. The package's own documentation asks for a
value that distinguishes instances — a hostname, a container id — once more than
one instance of a service runs.

One process runs today, so nothing is wrong. This wants the trigger recorded next
to the assumption it depends on: `docs/stack-api.md` rule 24's single-process
assumption, which is already the stated trigger for two other deferrals in
`docs/auth.md`'s Known gaps table.

---

**Group D — tooling. Either answer is defensible; pick one on purpose.**

**D1. `make check`'s last step is comparing against the wrong thing.**

The `check` target in [`Makefile`](../../Makefile) ends with
`git diff --exit-code` over the generated files, to fail when a generated file
was hand-edited. With no `HEAD` argument, `git diff` compares the **working
tree** to the **git index** — the staging area, not the last commit.

This repo mandates GitButler, and GitButler leaves the index holding a stale copy
after it commits. The result: `make check` fails on a tree that is clean against
`HEAD`, reporting drift in a file nobody touched. This was reproduced during the
`11` session and cost real time to diagnose.

`git diff --exit-code HEAD -- <paths>` compares against the last commit and is
correct under both plain git and GitButler.
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) carries the same
line and works there, because a fresh checkout's index is never stale.

The change is one token. It changes the project's main quality gate, which is why
it is a question and not a fix.

**D2. There is no API documentation page.**

`SwaggerModule` appears only in
[`apps/api/scripts/generate-openapi.ts`](../../apps/api/scripts/generate-openapi.ts),
which creates the document and writes it to a file. Nothing calls
`SwaggerModule.setup`, which is what mounts the browsable page. So
`http://localhost:3000` is a 404, and `apps/api/openapi.json` is a committed file
that a person has to paste into some other viewer to read.

Two honest answers. Mount a docs route — and then decide whether it is `@Public()`
and whether it exists in production at all, since it lists every route to anyone
who loads it. Or leave it as a generated file, and say so where a person would
look. Do not do both halfway.

## Constraints

1. **Read the named file before changing it.** Every finding above cites exact
   paths. Open each one. A finding written from a summary of a file is a finding
   about a file that may have moved on.

2. **Decide each finding with Lucas before fixing it. One at a time.** Present
   the trade-off as a **concrete worked example**, not an abstract choice — show
   the line as it reads now and the line as it would read, or the actual payload
   that would or would not leave the process. "It is a trade-off between
   observability and privacy" is not a decision aid. "With this on, an error in
   `sign-in.use-case.ts` sends these five lines of that file to Observe" is.

   Group A is the exception in degree, not in kind: the code is already the
   answer, so the decision is only *how* to word the correction. Still show the
   before and after.

3. **Never renumber a rule in a rule doc.** Roadmap items, task files and source
   comments cite rules by number — `stack-api.md` rule 39, `auth.md` rule 33.
   Revise a rule in place or append a new one. Renumbering silently breaks every
   citation, and nothing in the repo will tell you it happened.

   When a rule is revised rather than replaced, follow the convention already in
   these files: keep the rule, and say underneath what changed, when, and why.
   `docs/auth.md` rules 1, 2 and 3 are the worked examples of that style.

4. **A deferral is not a shrug.** Anything left undone gets written into the
   right Known gaps table with its trigger — the concrete event that makes it
   urgent — not a vague "later". Copy the shape `docs/auth.md`'s Known gaps table
   already uses: gap, intended direction, trigger.

5. **Change no credentials.** No real `OBSERVE_*` values anywhere, no edits to
   `.env`. `.env.example` is committed with empty values on purpose.

6. **Run `make check` before finishing**, and report the result honestly. If a
   decision produced a code change, the gate covers it. If it produced only doc
   changes, run `make roadmap-check` too.

7. **Do not touch two things.** The `**Status:**` and `**Rating:**` lines in
   `docs/prompts/11-rewrite-the-readme-as-the-repo-guide.md` are Lucas's to
   write. The empty GitButler branch `docs/11-rewrite-the-readme` belongs to
   another session — leave it alone.

## Tone

**Write like a patient teacher explaining to a smart beginner who is lazy about
reading but genuinely wants to understand.** This applies to the explanations in
chat *and* to every line written into a file.

- **Short sentences. One idea each. Plain words.** Lead with the point, then the
  detail.
- **Define every term on first use, in about four words.** A *guard*, a *use
  case*, an *index*, a *peer dependency*, a *statement separator*. Never an
  unexplained abbreviation, and never an abbreviation where the full word fits.
- **Prefer a table or a numbered list over a paragraph.** Prefer showing the two
  versions of a line over describing the difference between them.
- **No hedging. No "simply" or "just".** If something is fiddly, say it is fiddly
  and say why it is fiddly. The reader is not fragile; he is busy.
- **Every section skimmable:** a bold lead line, then the detail under it. A
  reader who reads only the bold lines should still get the decision right.

## Output

No single artefact. The deliverable is **eight closed findings** — each either
fixed in the file that owns it, or deferred with its trigger recorded in the
right Known gaps table.

Finish with a short report in the chat, not in a file:

| Finding | Outcome | Where it landed |
| --- | --- | --- |
| A1 … D2 | fixed / deferred | the file and the rule number, or the gaps table row |

For every deferral, name the trigger. For every decision that went against the
default, name the reason in one line, so the next person reading the file finds
the *why* and not only the *what*.
