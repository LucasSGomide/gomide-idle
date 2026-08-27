# Goal: Fill `docs/auth.md` — number it from 1 and write the rules for sessions, the one route guard, ownership checks and the session hook, on both sides

**Status:** not executed
**Rating:** —
**Run:** standalone, after [`09-close-the-loose-ends-prompt-08-left.md`](09-close-the-loose-ends-prompt-08-left.md). Read prompts 08 and 09 first — they set the numbering discipline, the split-by-kind rule and the voice this pass has to match.

## Context

`docs/auth.md` is an empty stub. It has a header, the standard "one imperative,
one line of why" preamble, and a comment saying nothing is here yet.
`project.yml` points the **Auth** area at it, so every `**Auth**` bullet in a
roadmap item currently lands on a file with no rules.

That gap is deliberate — prompt 08 declared client auth out of scope so the auth
pass would not have to argue with rules invented ahead of it. This is that pass.

**Auth is the least green-field area in the project.** Most of it is already
decided, in three different places, and the first job is to collect what is
settled rather than to decide it again:

- **`stack-api.md` rules 26–28** chose Better Auth, server-side sessions in the
  project's own Postgres rather than stateless JWTs, and one guard of the
  project's own wrapping the community NestJS adapter.
- **`stack-api.md` rule 17** puts `drizzle-kit` in charge of every migration:
  Better Auth's `generate` emits the Drizzle auth schema, `drizzle-kit` diffs and
  applies it, and Better Auth's own `migrate` is never run.
- **`docs/requirements.md` feature 1** is already fully written — UN.1–UN.6 and
  FR.1.1–FR.6.2 — and it is binding. It is also where most of the surprises are.

Those requirements rule out large parts of a normal auth doc, and the pass must
not quietly reintroduce them:

- **There is no outbound e-mail of any kind** (FR.1.2). The address is an
  identifier, never verified and never sent to. So there is no verification
  flow, no magic link, and no transactional mail provider.
- **There is no self-service password reset** (FR.1.5). Recovery is a manual
  database operation by the operator.
- **There are no roles.** One kind of user. What the project has instead is
  ownership: a character belongs to an account.
- **Rate-limit counters live in process memory** (FR.5.3), which is correct only
  while `stack-api.md` rule 24's single process holds.
- **Registration is closable by configuration** (FR.5.2), and closed-alpha access
  is an unlisted URL — no invite codes, no allowlist.

Two more things reach into this pass from elsewhere. `stack-api.md` rule 38
authenticates the socket handshake against the same session and checks `Origin`
on every connection, so auth is not only an HTTP concern here. And
`stack-web.md` rule 53 puts a language switcher on the signed-out screens whose
choice has to be carried onto the account at sign-up — a loose end prompt 09
deliberately left for this file.

There is still **zero application code** on either side, and no scaffold. Every
rule is written before the code it governs.

The user has supplied a starting shape: an auth doc from another project, in the
appendix below. Its headings are worth keeping. Several of its contents are not
— see constraint 4.

## Constraints

1. **Read before writing anything.** `docs/auth.md`, `docs/stack-api.md`,
   `docs/architecture-api.md`, `docs/stack-web.md`, `docs/architecture-web.md`,
   `docs/naming.md`, `docs/design.md`, `docs/requirements.md` (feature 1 in
   full, both the prose entry and every UN/FR row), `alpha.md`, and prompts 08
   and 09. The rule numbers this prompt cites are load-bearing — check each one
   still says what is claimed here before building on it.

2. **Number `docs/auth.md` from 1, and the numbering is permanent from then on.**
   The file is empty, so there is nothing to preserve and no renumbering to
   avoid — but after this pass it is append-only like every other rule doc, and
   roadmap items will cite it by number. Give it the same section-and-preamble
   shape `architecture-web.md` got in prompt 08.

3. **What is already settled is not re-argued.** Better Auth, Postgres sessions,
   no JWTs, `drizzle-kit` owning the migration, no e-mail, no reset, no roles,
   the unlisted URL. Write these down as rules with their whys and their prices;
   do not reopen them. Where a settled rule already lives in `stack-api.md`,
   cite it by number rather than restating it.

4. **The appendix is a shape, not a spec.** Keep its headings — What is chosen,
   Where it lives, It owns its tables, The API side, Authorization, The web
   side, Commands, Known gaps, Gotchas — and rewrite the contents for this
   project. Specifically:

   - **Delete the Email section entirely.** `EmailPort`,
     `sendVerificationEmail` and `sendResetPassword` describe a project that
     sends mail. This one does not (FR.1.2, FR.1.5). Say so once, in Known
     gaps, with the trigger that would change it.
   - **Rewrite Authorization as two questions, not three.** The `@Roles()` row
     has no subject here. The first row (is there a session? → the guard → 401)
     and the third (may this user act on *this* record? → the aggregate's own
     invariant in `domain/` → 403) both apply, and the third is the interesting
     one: a character belongs to an account.
   - **Rewrite the MSW gotcha in this project's vocabulary.** MSW was never
     chosen here; `stack-web.md` rule 41 chose Vitest and React Testing Library,
     and `architecture-web.md` rule 18 says a test swaps a port by wrapping
     `PortsProvider`, never by mocking a module. The underlying symptom is real
     and survives — jsdom has no cookie, so session state in a test is explicit
     rather than ambient — so keep the gotcha and change its answer.
   - **Translate every path.** The appendix says `packages/api/src/...` and
     `packages/web/src/api/`. This repo is `apps/api` and the seven folders of
     `architecture-web.md` rule 6, and `naming.md` rules 1–13 govern what files
     and symbols are called.
   - **Check the OpenAPI claim rather than copying it.** The appendix puts
     `/api/auth/*` deliberately outside the contract. `architecture-api.md`
     rules 56–62 say one schema per payload in `libs/contracts`, the OpenAPI
     document is a build output, and every error a route can return is
     registered in its response schema. Decide whether the exception survives
     here, and if it does, say what it costs.

5. **Split new rules by kind, exactly as prompts 08 and 09 did.** `auth.md`
   takes the auth rules. A rule that is really a library or tool choice is
   appended to `stack-api.md` or `stack-web.md` and cited from `auth.md` by
   number. A rule that is really about folders or dependency direction is
   appended to `architecture-api.md` or `architecture-web.md`. Where a rule
   needs two halves, write it once and cite it from the other file. Never say
   the same thing in two places.

6. **Never renumber and never delete a rule, in any doc.** A rule that must
   change is rewritten in place with its revision marked inline and its old
   reasoning left visible — the way `stack-web.md` rules 3, 8, 12, 26 and 51 and
   `stack-api.md` rules 12, 17 and 32 already are. A reader must be able to see
   what was believed before and why it was dropped. `architecture-web.md` rule
   22 is the one most likely to need this: it defers to `auth.md`, and after
   this pass that deferral has an address.

7. **Do not invent rules for code that does not exist.** Every rule must trace
   back to something real in `alpha.md`, `docs/requirements.md`, `docs/design.md`
   or an existing rule doc. There is no scaffold on either side.

8. **Name what each decision costs.** A why line that only lists benefits is
   advertising. Some of the prices here are already known and should be stated
   plainly: a session read on every request, a rate limiter that is only correct
   in one process, an operator doing password recovery by hand, and a community
   NestJS adapter this project deliberately does not depend on.

9. **Ask before you assume.** Use `AskUserQuestion`, or invoke `msg-grill-me`
   for a fuller interview, rather than inventing an answer. One question at a
   time. At minimum these are open:

   - Is the Better Auth client a port held in `PortsProvider`
     (`architecture-web.md` rules 14–18), or a deliberate exception outside it
     the way the `RendererPort` is in rule 19?
   - How does the pre-auth language choice (`stack-web.md` rule 53) reach the
     account at sign-up?
   - What does the one layout-route guard actually read, and what does the
     screen show while the session query is in flight?
     `architecture-web.md` rules 21–24 draw the loading-versus-empty line.
   - Where is ownership checked, and which `ErrorTypeEnum` member does it
     surface as? `architecture-api.md` rules 39 and 40 govern when a new
     `ApiError` subclass is earned.
   - Is a failed socket handshake (`stack-api.md` rule 38) the same client-side
     path as an expired HTTP session, or a second one?
   - Does the in-memory rate-limit state (FR.5.3) earn a stated rule here, or
     stay a requirements-only fact?

10. **Match the house style.** One imperative, one line of why, numbered,
    append-only. Plain words. Where a real term of art is the right name —
    guard, session, aggregate, port — use it once and define it in four words.

11. **Executed prompt files under `docs/prompts/` are historical records — leave
    them alone**, except for this file's own `Status` line.

12. **Run `make roadmap-check` and leave it passing**, and confirm `project.yml`
    still points every area at a file that exists.

## Tone

The voice these docs already use: plain words, short sentences, one idea each.
No hedging, no both-sidesing. Assume the reader knows TypeScript and React well,
and knows this game's mechanics not at all — so name a screen ("the character
select screen") rather than assuming its shape is obvious.

## Output

Edits in place, no new planning docs:

- **`docs/auth.md`** — numbered from 1. The main deliverable.
- **`docs/stack-api.md` / `docs/stack-web.md`** — appended rules for anything
  that is a library or tool choice rather than an auth rule.
- **`docs/architecture-api.md` / `docs/architecture-web.md`** — appended rules
  for anything structural, and `architecture-web.md` rule 22 revised in place if
  this pass gives its deferral an answer.

Finish with two short sections in the chat, not in the docs:

1. **What was decided** — the open questions in constraint 9, and how each was
   closed, so they are recoverable without re-reading the diff.
2. **Findings** — anything this pass turned up that the prompt did not ask
   about: contradictions between docs, rules that are now dead, gaps noticed and
   deliberately not filled. Report them; do not act on them.

## Appendix: the starting shape

From another project, supplied by the user. Keep the headings, rewrite the
contents per constraint 4.

```markdown
# Auth — sessions, guards and the session hook

Everything about who the caller is and what they may do, on both sides. It sits
apart from the stack docs because plenty of projects have nothing to sign in to:
a project without this doc has no sessions, no guards and no sign-in screen, and
that is a decision rather than an omission.

## What is chosen

| Concern | Choice | Why this one |
| --- | --- | --- |
| Library | Better Auth | Owns sessions, providers and password reset; Drizzle adapter, no service to run |
| Session transport | Cookies | Nothing to store in JavaScript, so no interceptor and no refresh logic |
| Web client | Better Auth React client | Same library as the API, talking to the same routes |
| Sending mail | The API's `EmailPort` | Verification and reset resolve the port; no provider SDK in the auth config |

## Where it lives

`packages/api/src/` — `config/auth.config.ts` builds the Better Auth instance
(Drizzle adapter, providers, hooks); `config/database/schemas/` holds the
generated `auth.schema.ts`; `entry-point/http/auth/` mounts Better Auth and
holds the session and role guards. `packages/web/src/` — `api/auth-client.ts`
is the Better Auth React client (sign-in, sign-out, session);
`shared/hooks/use-session.hook.ts` is its only consumer.

## It owns its tables

`better-auth generate` writes `user`, `session`, `account` and `verification`
into `config/database/schemas/auth.schema.ts`; that file is committed and never
hand-edited. Drizzle still generates the migration from it, so there is one
migration pipeline. The domain keeps its own user aggregate, keyed by the Better
Auth user id. Source of truth is split on purpose and stated once: credentials,
sessions, verified email and linked providers are Better Auth's; everything the
product means by a user is the domain's.

## The API side

Mounted as a Fastify route, not re-declared as Nest controllers.
`config/auth.config.ts` builds the instance; `entry-point/http/auth/` mounts its
handler at `/api/auth/*` and holds the guards. The session guard calls
`auth.api.getSession` and puts the session into the request-scoped
`AsyncLocalStorage`. Use cases receive the user id as an argument —
`application/` never reaches into the store for it. `/api/auth/*` is deliberately
outside the OpenAPI contract: not in `openapi.json`, Orval generates no client
for it, `codegen-check` is not expected to see it.

## Authorization

Three questions, three homes. Merging them is what makes permissions untestable:

| Question | Where it lives | Result |
| --- | --- | --- |
| Is there a session? | session guard, `entry-point/http/auth/` | 401 |
| Does this role reach this route? | `@Roles()` guard on the controller | 403 |
| May this user act on **this record**? | the aggregate's own invariant, in `domain/` | 403 |

Ownership is an invariant, not a route concern: the record is already loaded by
the use case, so checking it in a guard means fetching twice and putting the rule
somewhere no unit test can reach it. The aggregate throws `ForbiddenException`
like any other domain rule. The identity itself is passed into the use case as an
argument; `application/` and `domain/` never read it from ambient context.

## The web side

The session is server state like any other. One hook owns it; components ask that
hook. Nothing about the signed-in user is copied into a store, and no credential
is kept in JavaScript.

- `api/client.ts` sets `credentials: 'include'` on every request; the API must
  answer with `credentials: true` and an explicit origin.
- `api/auth-client.ts` is Better Auth's React client talking to `/api/auth/*`.
  That path is not in the OpenAPI spec, so Orval generates nothing for it — the
  one hand-written client, deliberately.
- `shared/hooks/use-session.hook.ts` is the only consumer of the auth client.
  Pages and components ask that hook, never the client.
- Protected routes use a TanStack Router `beforeLoad` guard that resolves the
  session and redirects to sign-in with the target route in a search param.

Handling a 401: an expired session surfaces as a 401 on an arbitrary query, so it
is handled centrally in `api/client.ts` — it throws a typed `UnauthorizedError`,
clears the session query and redirects to sign-in preserving the current route.
`beforeLoad` covers the first load; the client covers everything after it. No
component ever branches on status 401: if a screen appears to need it, the answer
is a route guard or a 403, not a status check in JSX.

## Email

Better Auth's `sendVerificationEmail` / `sendResetPassword` hooks resolve the
API's `EmailPort` — they never import a provider SDK directly.

## Commands

| Command | What it does |
| --- | --- |
| `make api-auth-schema` | `better-auth generate` into `config/database/schemas/` |

## Known gaps

| Gap | Intended direction when it comes up | Trigger |
| --- | --- | --- |
| Rate limiting | Better Auth's own rate limiter, with a shared store rather than in-memory | First public deploy — do not skip this one |
| Roles and tenancy | `@Roles()` covers a flat role list; anything hierarchical or per-tenant is unresearched | The second role that is not admin/user |

## Gotchas

Each of these cost real time. Read the symptom, apply the rule. Numbered, and
never renumbered — append.

### 1. Cookie sessions need `credentials` on both sides, and no wildcard origin

**Symptom:** sign-in succeeds, the response even carries `set-cookie` — and every
subsequent request is a 401.

**Rule:** three things must line up, and missing any one produces the same 401.
`corsOptions` sets `credentials: true` **and** an explicit origin list, because a
wildcard `*` is silently ignored once credentials are involved. The web fetch
instance sends `credentials: 'include'`. The cookie's `sameSite`/`secure` pair
matches the deployment — same-site over `localhost` works with `lax`, while a
cross-domain deploy needs `sameSite: 'none'` **and** `secure: true`, which means
HTTPS on both ends. That last one is the one that passes locally and fails
deployed.

### 2. MSW does not carry cookies — session state in tests is explicit

**Symptom:** an integration test of a protected page renders the signed-out
branch forever, or hangs on the session query, while the same page works in the
browser.

**Rule:** the cookie the API sets does not exist in jsdom, so the session is not
ambient in tests. Either stub `use-session.hook.ts`, or add an MSW handler for
the Better Auth session endpoint in `vitest.setup.ts` — the generated handlers
cover `/api/*` but not `/api/auth/*`. Pick one per tier and keep it there.
```
