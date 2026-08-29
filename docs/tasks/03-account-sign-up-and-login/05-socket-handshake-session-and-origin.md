# 05 — The socket handshake's session check and its Origin check

**Roadmap:** [03](../../roadmap/03-account-sign-up-and-login.md) · **Scope:** back-end · **Depends on:** 02

## Context

- `FR.3.2` is the one thing [`01`](../../roadmap/01-the-api-foundation.md)
  deliberately left open. `system.gateway.ts` still carries the comment
  "Unauthenticated for now (decided 2026-08-28): no session check."
- The gateway is `@WebSocketGateway({ cors: { origin: true } })`, which reflects
  whatever origin asks. Better Auth's own `Origin` check lives in the HTTP
  handler this project no longer mounts, so nothing performs it;
  `stack-api.md` rule 38 still requires it on every connection.
- **Open:** which module owns the session-id-to-connection map, and whether
  `system` may depend on `auth` for it. The only gateway in the repository is
  `system`'s. This slice decides it and records why — under `auth.md` rule 1,
  whichever way it goes, `system` may depend on the auth module but never import
  `better-auth` itself.
- **Open:** what the allowed origin list holds in development, where
  `stack-web.md` rule 62's Vite proxy is the only origin. Decided here, and task
  `06` depends on the answer.
- `FR.2.6`'s five-second leave runs on a *hunt*, and no hunt exists yet. Closing
  the connection is in scope; the leave is not.

## Technical details

- **Auth** — read the session once at the handshake against the same server-side
  row ordinary requests use, and store its id on the connection; `auth.md`
  rule 32.
- **Auth** — refuse a handshake with no session using a `NO_SESSION` code in an
  error frame rather than a bare disconnect, matching `01`'s error twin; add the
  code to `ERROR_CODES` before throwing it.
- **Auth** — deleting a session closes the connections that session opened, at
  once rather than at the next disconnect, and leaves another device's alone;
  `auth.md` rule 33, `FR.2.6`.
- **API stack** — replace `cors: { origin: true }` with the `Origin` check
  `stack-api.md` rule 38 requires, its allowed list read from the environment and
  holding the dev proxy origin in development.
- **Back-end** — place the session-id-to-connection map in the module that owns
  it and record the choice, keeping the layer direction inward-only;
  `architecture-api.md` rules 19–24.

## Acceptance criteria

- [ ] `(integration)` a handshake carrying a valid session cookie connects, and the connection holds that session's id
- [ ] `(integration)` a handshake with no cookie is refused with a `NO_SESSION` error frame, not a bare disconnect
- [ ] `(integration)` a handshake carrying an expired session is refused with `NO_SESSION`
- [ ] `(integration)` a handshake from an origin outside the allowed list is refused, and one from an allowed origin connects
- [ ] `(integration)` `POST auth/sign-out` closes that session's connections while a second session's connection for the same user stays open
- [ ] `(unit)` `NO_SESSION` passes `assertSituationCode`

## References

- `auth.md` rule 1 — every Better Auth import stays inside the auth module,
  which bounds the ownership decision above.
- `auth.md` rules 32–33 — read the session once at the handshake; a delete closes
  that session's sockets.
- `stack-api.md` rule 38 — the handshake session check and the `Origin` check.
- `architecture-api.md` rules 19–24, 43, 45 — the layers and the gateway's error
  twin.
- `apps/api/src/modules/system/entrypoint/system.gateway.ts` — the gateway as it
  stands, with `cors: { origin: true }` and no session check.
- `requirements.md` `FR.3.2` — the handshake authenticated against the same
  session, and the `Origin` checked on every connection.
- `requirements.md` `FR.2.6` — deleting a session closes the sockets it opened.
- `stack-web.md` rule 62 — the dev proxy origin the allowed list must hold.

## Implement with

`/api-feature`
