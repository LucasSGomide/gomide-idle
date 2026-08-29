# 03 — Account sign-up and login: accounts, sessions and the first guarded screen

Sliced so each task leaves the repository green on its own. `01` to `05` are the
API half and land in dependency order: the library and its tables, the four
endpoints that are the whole contract, then the three things that guard them —
the session guard, the sign-in rate limit and the socket handshake. Each of the
last three is its own slice because each is unexercised in this repository, and
folding them into `02` would hide which one broke.

`06` is the hinge. Nothing here has ever made a browser request to the API, so the
proxy, the regenerated client and the footer finally reaching real Nest are one
slice on their own — the first place the transport can fail, isolated so the
failure is legible. It sits behind `05` because one origin means the socket path
too.

`07` and `08` are the screens, in that order: the guard and `/characters` first,
because sign-in has to land somewhere and sign-up has to redirect somewhere. `08`
also waits on `04`, since `TOO_MANY_ATTEMPTS` is one of the four codes its forms
render.

Deferred on purpose: `player_account` and the signed-in language write go to
**Language and localisation**, and the character list, the online slot and the
five-second leave to **Character creation and selection**. Neither item has a
roadmap doc yet, and `make roadmap-check` validates numbered dependencies only —
so neither deferral is enforced by anything but this paragraph.

| # | Task | Scope | Depends on | Criteria | Status |
|---|---|---|---|---|---|
| [01](01-better-auth-instance-and-generated-schema.md) | The Better Auth instance, its generated schema and the migration | back-end | — | 7/7 | done |
| [02](02-auth-contracts-and-the-four-endpoints.md) | The auth contracts, the four endpoints and their error codes | back-end | 01 | 8/8 | done |
| [03](03-session-guard-and-registration-switch.md) | The global session guard and the registration switch | back-end | 02 | 0/7 | not-started |
| [04](04-sign-in-rate-limiting.md) | Rate-limiting sign-in, by address and by account | back-end | 02 | 0/6 | not-started |
| [05](05-socket-handshake-session-and-origin.md) | The socket handshake's session check and its Origin check | back-end | 02 | 0/6 | not-started |
| [06](06-one-origin-dev-server-and-generated-auth-client.md) | One origin in development, and the generated auth client | full-stack | 02, 03, 05 | 0/9 | not-started |
| [07](07-session-feature-authed-guard-and-characters-shell.md) | `features/session`, the `_authed` guard and the characters shell | front-end | 06 | 0/7 | not-started |
| [08](08-sign-in-and-sign-up-screens.md) | The sign-in and sign-up screens | front-end | 04, 07 | 0/10 | not-started |
