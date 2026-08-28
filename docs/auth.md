# Auth rules

Rules for anything auth-shaped. `project.yml` points every
`**Auth**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

Written 2026-08-27, from an empty stub, by
[`prompts/10-write-the-auth-rules.md`](prompts/10-write-the-auth-rules.md).
Auth is the least green-field area in this project:
[`stack-api.md`](stack-api.md) rules 26–28 chose the library and the session
store, rule 17 put `drizzle-kit` in charge of the migration, rule 38
authenticates the socket, and [`requirements.md`](requirements.md) feature 1 —
UN.1–UN.6, FR.1.1–FR.6.2 — is binding and already written. Most of
what follows is therefore collected rather than decided, and cites the rule that
settled it rather than restating it.

One numbering sequence runs through the whole file, the Gotchas included, so a
roadmap item citing "auth.md rule 30" lands on exactly one thing.

Rules 31–33 were added 2026-08-28, and rules 6, 7 and 10 revised in the same
pass, by an audit of the **Account sign-up and login** requirements before their
roadmap item. It found three requirements with no mechanism — the session's
length, its behaviour during a hunt, and what a delete actually does — plus a
`user_preference` table this file had forbidden a home for and never given one.
Rules 34–35 and the revision to rule 17 came from the same pass, once Better
Auth 1.7.2's rate limiter had been read rather than assumed.

Gotchas 29 and 34 were narrowed later on 2026-08-28 by the **Scaffolding**
requirements. Both closed by saying the deployment was undecided and that the
trap "will be met"; `stack-api.md` rules 48 and 49 decided it. One origin behind
one proxy makes gotcha 29's cross-domain branch unreachable, and a proxy that
writes `X-Forwarded-For` and ignores incoming ones leaves gotcha 34 with one
header to name rather than a chain to trust. Neither gotcha is deleted — what
each has left is the half that still bites.

## What is chosen

| Concern | Choice | Why this one |
| --- | --- | --- |
| Library | Better Auth | Owns credentials and sessions, has a Drizzle adapter, and needs no service of its own (`stack-api.md` rule 26) |
| Session store | The project's own Postgres | The server hits the database on every request anyway, so revoking is a `DELETE` (`stack-api.md` rule 27) |
| Session transport | A cookie | Nothing to hold in JavaScript, so no interceptor, no refresh logic and no token to leak |
| Web client | Better Auth's React client | The same library as the API, talking to the same routes, with the types already written (`stack-web.md` rule 59) |
| Sending mail | Nothing at all | The address is an identifier and is never sent to (FR.1.2) |
| Roles | None | One kind of user; the only authorization question is ownership |

## Where it lives

1. **Keep every Better Auth import inside `apps/api/src/auth`.** One module owns
   the dependency, so an upgrade or a swap is one folder rather than a grep —
   and `stack-api.md` rule 30 already gave auth a module of its own.

2. **Build the instance in the auth module's `infrastructure/`, and mount it
   from its `entrypoint/`.** The library is an adapter and mounting is an
   entrypoint concern, which is `architecture-api.md` rule 19's split applied to
   a dependency that would otherwise sit in neither layer.

3. **Mount Better Auth as one Fastify route at `/api/auth/*`; never re-declare
   its endpoints as Nest controllers.** A controller in front of a library route
   is a second implementation of sign-in, and the two drift the first time the
   library adds a field.

4. **On the web, build the client in `lib/` and let one `features/session/`
   folder be its only consumer.** Every screen that cares about who is signed in
   asks that feature, so there is one place to change when the library does.
   `architecture-web.md` rule 33 is the other half — who is allowed to ask.

## It owns its tables

5. **Let `better-auth generate` write `user`, `session`, `account` and
   `verification` into the auth module's Drizzle schema, commit that file, and
   never hand-edit it.** `stack-api.md` rule 17 makes `drizzle-kit` the only
   migration path in the repo, so a hand-edit is a change the next `generate`
   silently reverts.

6. **Put no product data in Better Auth's tables.** Credentials, sessions and
   linked providers are the library's; everything the game means by a player is
   the domain's own, in `player_account` — the `player` module's table, keyed by
   the Better Auth user id (`stack-api.md` rule 30). Declaring extra fields on
   `user` instead would put a HUD preference inside a generated file and make
   every new setting an edit to the auth config plus a regeneration. The price of
   the split is a second read: the language is not in the row the session lookup
   already loaded. *Revised 2026-08-28; this rule named a `user_preference` table
   and no module to hold it, so it forbade the obvious home without naming an
   alternative. Two things changed: the table is the player's own row rather than
   a preferences side-table, so a setting is a column on it; and it uses the
   game's word rather than the library's — `user` is Better Auth's identity row
   (`naming.md` rule 14).*

7. **Scope a preference to the account or to the character, in two tables, and
   never to both.** The language and the death setting belong to the player
   (FR.7.2, `alpha.md`); a saved build or a HUD layout belongs to one character.
   One table for both would carry a null character id on half its rows and lose
   the only thing that makes the boundary checkable. Neither table is ruled here:
   the account-scoped one is `player_account`, named and ruled by the `player`
   module, and the character-scoped one by the `character` module. *Revised
   2026-08-28: the account-scoped half had no stated home, which is what
   `stack-api.md` rule 30's fourth module now gives it.*

8. **Read a missing `player_account` row as the defaults, never as an error.**
   Nothing writes that row at sign-up — there is no create hook — so absence is
   the ordinary state of a new account, and a reader that treats it as a fault
   breaks every account on its first request. *Revised 2026-08-28 for rule 6's
   rename. It matters more now: the row is the player rather than a side-table of
   their settings, so "the player does not exist yet" has to be an ordinary read
   rather than a missing parent — which is also why `stack-api.md` rule 26's
   foreign key on `character` points at `user.id` and not at this row.*

9. **Treat `language: null` as "never chosen on this account", and let the
   client write its local choice once when it sees it.** `stack-web.md` rule 53
   has to carry the signed-out language onto the account, and a null makes that
   carry-through and the retry after a failed write the same code path — with
   rule 52's `localStorage` mirror meaning the player never sees an English
   frame while it settles. A stored `'en'` therefore means the player chose
   English, and is never overwritten.

10. **Keep counters and quotas off `player_account`.** The daily Hard-run count
    (`docs/requirements.md` feature 28) is state the server resets on a schedule,
    not something a player set; sharing a row between the client's writes and the
    game's would put a language switch and a quota decrement in contention for no
    reason. *Revised 2026-08-28 for rule 6's rename only; the imperative is
    unchanged and it matters more now that the row holds the player rather than
    just their preferences — "it is already the player's row" is exactly the
    argument that puts a counter on it.*

## The API side

11. **Read the session in one guard of the project's own, calling Better Auth's
    `getSession`, and let that guard be the only caller.** `stack-api.md` rule 28
    already declined the community NestJS adapter; the price it named is a couple
    of hours of wiring, and this rule is what keeps that price from being paid
    twice.

12. **Apply the session guard globally and mark the few public routes with one
    decorator.** A guard applied per controller is the guard missing from the
    controller added next week — the same argument `architecture-web.md` rule 22
    makes for the client's single layout guard.

13. **Pass the authenticated user id into a use case as part of its input.**
    `application/` and `domain/` never read an ambient store for it, because the
    same use case is called by an HTTP controller and by a socket handler
    (`architecture-api.md` rules 24 and 25) and only one of those has a request.

14. **Authenticate the socket handshake with that same guard's session read, per
    `stack-api.md` rule 38, and refuse it with an `ErrorTypeEnum` member rather
    than a bare disconnect.** A refused handshake has at least three causes —
    no session, an account already playing (FR.4.2), a stale protocol
    (`stack-web.md` rule 22) — and a client that cannot tell them apart has to
    guess which screen to show.

15. **Configure Better Auth with no mail sender at all, and switch e-mail
    verification and password reset off rather than leaving them unwired.**
    FR.1.2 makes the address an identifier and nothing more; a hook left unwired
    is a route that answers with a server error instead of not existing.

16. **Recover a forgotten password by hand, as an operator writing to the
    database.** FR.1.5 says there is no self-service reset, and the price is
    exactly what it sounds like: a person hashing a password at whatever hour the
    player asks, with no audit trail but the shell history.

17. **Rate-limit sign-in per source address and per account, in two mechanisms
    sharing one store.** FR.5.1 is the only lock on a door whose key is an
    unlisted URL. Better Auth already limits `/sign-in/email` to three attempts
    per ten seconds per address, which is the first half for free; the second half
    does not exist in the library at all, so it is a `hooks.before` middleware of
    ours keyed on the submitted e-mail, throwing `TOO_MANY_REQUESTS` — see
    `stack-api.md` rule 39 for why no configuration surface reaches it. Point
    `rateLimit.customStorage` at the same module the hook counts in, so the two
    halves share one eviction policy and one thing to move on the day FR.5.3
    expires. FR.5.3 is the price and it has that expiry date: the counters are
    correct only while `stack-api.md` rule 24's single process holds, and nothing
    fails loudly on the day a second one is added — so this rule and rule 35 of
    `stack-api.md` expire together. *Revised 2026-08-28; this rule said "with the
    limiter `stack-api.md` rule 39 chose", which implied one mechanism met both
    halves of FR.5.1. Reading Better Auth 1.7.2 showed it meets one.*

18. **Close registration by configuration, refusing a new sign-up with a stated
    reason while every existing account keeps working.** FR.5.2 — when the
    unlisted URL leaks, closing the door is the only lever the alpha has.

19. **Keep `/api/auth/*` outside the OpenAPI document, deliberately.** Better
    Auth owns those routes and their payloads, and it is mounted as a Fastify
    handler rather than a Nest controller (rule 3), so there is no place to hang
    the `libs/contracts` schema `architecture-api.md` rule 56 would otherwise
    require. Three prices, all real: Orval generates no client for them, so the
    auth client is the one hand-written client on the web; a codegen check never
    sees them; and their errors are not `ErrorTypeEnum` members, which is why
    rule 27 exists.

## Authorization

Two questions, two homes. The appendix this doc grew from had three — a role
check sat in the middle — and there is no such thing here.

| Question | Where it is answered | Result |
| --- | --- | --- |
| Is there a session? | the session guard (rules 11–12) | 401 |
| May this user act on **this** record? | the load itself — every read is scoped by owner | 404 |

20. **Take the acting user's id in every repository and DAO method that reaches
    account-owned data, and expose no unscoped find-by-id.** A check that can be
    forgotten will be, on the ninth use case; a method that does not exist cannot
    be called. `architecture-api.md` rules 30–34 are the shapes this applies to.
    The price is a user id on every read signature, including the ones where it
    looks redundant.

21. **Answer a miss with one `NOT_FOUND`, whether the record is gone or belongs
    to someone else.** The two are indistinguishable by construction after rule
    20, it leaks nothing about what other accounts hold, and the client's
    reaction is identical either way — which is exactly when
    `architecture-api.md` rule 40 refuses a second error type.

22. **Write no role check, and add no role column.** There is one kind of user
    (`docs/requirements.md` feature 1), so a role guard would have no subject and
    would be a mechanism maintained for a distinction nobody makes.

## The web side

The session is server state like any other, so it is a query. Nothing about the
signed-in user is copied into a store and no credential is held in JavaScript.

23. **Read the session with an ordinary TanStack Query hook over
    `getSession` — never Better Auth's own `useSession`.** The library's hook
    keeps its own copy of the session beside the Query cache, and `stack-web.md`
    rule 2 has exactly one cache for everything the server owns.

24. **Resolve the session in `_authed.tsx`'s `beforeLoad` before a protected
    screen renders, and redirect to the sign-in route carrying the target in a
    search param.** Awaiting is what leaves three states in one file — waiting,
    signed in, signed out — so no screen below ever branches on session status
    and `architecture-web.md` rule 22's single guard stays true in practice
    rather than only on paper. The price is a cold load that waits for one
    request before painting.

25. **Never render a session that is still loading as a signed-out one.** It is
    `architecture-web.md` rule 24's loading-versus-empty line pointed at auth,
    and getting it wrong shows the sign-in screen for a moment to a player who
    was signed in the whole time.

26. **Handle a 401 in one place — the fetch mutator in `lib/` that every
    generated hook calls — by clearing the session query and redirecting to
    sign-in with the current route preserved.** An expired session surfaces on
    whichever query happens to run next, so a component that branches on 401 is
    a branch that has to exist in every component. A refused handshake carrying
    `UNAUTHORIZED` (rule 14) calls that same function; the other refusal reasons
    do not, because being already online elsewhere is not a reason to sign
    anybody out.

27. **Map Better Auth's error codes to catalogue keys once, in
    `features/session/`.** Rule 19 keeps those routes out of `ErrorTypeEnum`, so
    `architecture-web.md` rule 27's "render from the type, never the message"
    has nothing to switch on here — and rendering the library's own English
    string would put English on a Portuguese screen, which is the thing that
    rule was written to stop.

28. **Send the cookie on every request and keep no credential in JavaScript.**
    It is what makes the session invisible to the client, and it is also the
    thing that fails silently when one of three settings is wrong — see rule 29.

## Commands

| Command | What it does |
| --- | --- |
| `make api-auth-schema` | Runs `better-auth generate` into the auth module's Drizzle schema, per rule 5 |

## Known gaps

| Gap | Intended direction when it comes up | Trigger |
| --- | --- | --- |
| Outbound e-mail | An `EmailPort` in the API that Better Auth's hooks resolve — never a provider SDK in the auth config | Registration opening to anyone who is not a friend |
| Self-service password reset | Better Auth's own reset flow, which needs the e-mail above first | The same trigger, or the second recovery done by hand |
| Shared rate-limit storage | Both of rule 17's halves pointed at storage two processes can see — they share one store precisely so this is one move | The day a second process is added (`stack-api.md` rule 24) |
| Roles | Nothing is designed, on purpose (rule 22) | The first action only an operator may take |
| The `verification` table | Generated by rule 5 and permanently empty while rule 15 holds | It fills by itself the day verification or reset is switched on |
| Social sign-in | Better Auth ships providers and the `account` table is already generated for them | A player who wants to sign in with Google |

## Gotchas

Each of these costs real time. Read the symptom, apply the rule. Same numbering
as everything above, and appended to the same way.

29. **Cookie sessions need `credentials` on both sides, and no wildcard
    origin.** *Symptom:* sign-in succeeds, the response even carries
    `set-cookie`, and every request after it is a 401. *Rule:* three things must
    line up and missing any one produces that same 401. The API's CORS options
    set `credentials: true` **and** an explicit origin list, because a wildcard
    is silently ignored once credentials are involved. The web's fetch mutator
    sends `credentials: 'include'`. The cookie's `sameSite`/`secure` pair matches
    the deployment — same-site over `localhost` works with `lax`, while a
    cross-domain deploy needs `sameSite: 'none'` **and** `secure: true`, which
    means HTTPS at both ends. *Revised 2026-08-28: this closed "The last one is
    the one that passes locally and fails deployed, and `stack-api.md` rule 22
    leaves the host undecided, so it will be met." It will not be met.
    `stack-api.md` rule 48 puts the web and the API on one origin behind one
    proxy, so `sameSite: 'lax'` is correct in development and in production
    alike and the `'none'` branch is unreachable by construction rather than
    merely avoided. The other two — `credentials: true` with an explicit origin
    list, and `credentials: 'include'` on the mutator — still apply and still
    produce this 401 when either is missing.*

30. **jsdom has no cookie, so a session in a test is written rather than
    assumed.** *Symptom:* a test of a protected screen renders the signed-out
    branch forever, or hangs on the session query, while the same screen works
    in the browser. *Rule:* the cookie the API sets does not exist in the test
    environment, so the session is never ambient there. `stack-web.md` rule 58
    puts MSW at the network boundary, but Orval generates handlers only for
    documented routes and rule 19 keeps `/api/auth/*` undocumented — so the
    session handler is one of the few written by hand, in the test setup.
    Seeding the session query directly is the other way; pick one per tier and
    keep it there, because a test doing both hides which one it is relying on.

## The session's lifetime

Added 2026-08-28. FR.2.2 and FR.2.3 promise a 30-day sliding session that never
ends a running hunt, and nothing here said how either was met — so the library's
own 7-day default silently decided the first, and the second had no mechanism at
all. These three rules are one design and are best read together.

31. **Configure the session to 30 days, with its expiry extended on activity —
    never leave Better Auth's defaults.** FR.2.2 is the requirement and the
    library ships 7 days with a 1-day refresh, so the gap between what is written
    down and what runs is a config value nobody would think to check. The same
    goes for FR.1.3's 8-to-128 password bounds, which happen to match the
    defaults today: pin them, because a requirement met by coincidence is met
    until the next minor version.

32. **Read the session once, at the socket handshake, and never again for that
    connection's life.** FR.2.3 says expiry never terminates a running hunt, and
    a hunting player sends no HTTP requests for hours — the socket carries
    everything — so rule 31's sliding renewal cannot reach them and a re-check
    mid-flight would end the fight that the requirement exists to protect. The
    price is that a session revoked on purpose would otherwise outlive the
    revocation, which is the whole reason rule 33 exists.

33. **Delete a session and close the sockets that session opened, storing the
    session id on the connection at the handshake.** FR.2.1 promises that ending
    a session is a `DELETE`, and rule 32 means nothing will notice that delete on
    its own — so without this the promise is false for exactly the players who are
    hunting. The session id rather than the account id is what makes FR.2.4 work:
    signing out on a phone must not close the socket a laptop is hunting on, and
    `stack-api.md` rule 35's online-slot registry is keyed by account, so it
    cannot tell those two connections apart. Signing out while hunting then needs
    nothing of its own — the close starts the ordinary five-second leave (FR.2.5),
    which is what makes quitting, crashing and signing out one event.

## Gotchas, continued

Added 2026-08-28 with rule 17, from reading Better Auth 1.7.2's limiter and its
NestJS integration. Same numbering as everything above; these sit after the
session section because the sequence ascends through the file, not because they
are a different kind of thing from rules 29–30.

34. **Rate limiting behaves one way locally and the opposite way deployed, and
    both directions are wrong by default.** *Symptom:* nothing is limited at all
    on your machine, however hard you hammer sign-in — and then in production
    players start getting 429s after three attempts *between all of them*, as if
    the limit were global. *Rule:* two separate defaults cause that. `rateLimit`
    is enabled in production only, so `enabled: true` belongs in the development
    config or the limiter is never once exercised before it ships. And Better
    Auth resolves the client address from **headers only** — there is no
    `socket.remoteAddress` fallback — defaulting to `x-forwarded-for`; when no
    trusted header reaches it the address is `null` and every attempt in the world
    lands in one bucket keyed `no-trusted-ip|/sign-in/email`. Set
    `advanced.ipAddress.ipAddressHeaders` to `x-forwarded-for`. *Narrowed
    2026-08-28: this read "to the single header the deployment's proxy actually
    writes, plus `trustedProxies` if the chain is multi-hop", and closed by
    calling it "the class of thing that passes locally and fails deployed …
    decided late and by someone not reading this file". It is decided now.
    `stack-api.md` rule 49's proxy writes `X-Forwarded-For` and deliberately
    ignores any incoming one, so there is no chain to trust and `trustedProxies`
    has nothing to configure. The other half of that rule is the half that still
    bites: Fastify needs `trustProxy` set, or `req.ip` is the proxy on every log
    line and in every rate-limit bucket.* Like
    gotcha 29 this is the class of thing that passes locally and fails deployed,
    for the same underlying reason: `stack-api.md` rule 22 leaves the host
    undecided, so anything derived from the proxy in front of it is decided late
    and by someone not reading this file.

35. **Nest's body parser and Better Auth want the same request body, and Nest
    wins by default.** *Symptom:* sign-in fails on a body the client demonstrably
    sent, or rule 17's per-account hook reads `ctx.body` as `undefined` while the
    per-address limiter works fine. *Rule:* rule 3 mounts Better Auth as a Fastify
    handler underneath Nest, so the framework has already consumed the stream by
    the time the library reads it. Disable Nest's body parser at bootstrap. This
    is a prerequisite for rule 17's second half rather than a detail of it — a
    hook keyed on the submitted e-mail cannot key on anything if the body is gone.
