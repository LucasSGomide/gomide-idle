# 06 — The socket handshake and its error twin

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** 03

## Context

- `FR.10.3` puts the protocol version on the handshake so a stale client refuses
  to connect rather than silently rendering nonsense — a stale client that
  renders nonsense costs more to diagnose than one that will not start
  (`stack-api.md` rule 15). Roadmap item `02` adds the client's refusal.
- The handshake is **unauthenticated**, decided 2026-08-28. `FR.3.2` wants it
  checked against a server-side session and there is no session yet; the
  **Account sign-up and login** item adds that check to a handshake that already
  exists, which is an edit rather than the throwaway `FR.10.4` forbids.
- Completes the exception filter begun in task `03` with its socket twin. The two
  emit the same `code`, which is what lets the web switch on one vocabulary
  regardless of transport (`FR.13.3`).
- Never closing the connection on an error is the point of the socket filter: a
  dropped connection turns one failed message into a reconnect and a lost
  session.

## Technical details

- **API stack** — the handshake payload schema in `libs/contracts`, carrying
  `.meta({ id })` (`stack-api.md` rule 47, `FR.11.1`, `FR.11.4`).
- **Back-end** — the Socket.IO gateway: the handshake sends the protocol integer
  and performs no session check.
- **Back-end** — the socket exception filter, twin to task `03`'s HTTP one: it
  emits the same `code`, plus the correlation id of the message that caused it,
  and never closes the connection (`FR.13.2`, `architecture-api.md` rule 45).
- **Back-end** — the socket handler stays free of decisions, so it and an HTTP
  controller can call the same use case (`architecture-api.md` rule 24).
- **Naming** — the socket error `code` follows the same
  `SCREAMING_SNAKE_CASE` situation naming as the HTTP one (`naming.md` rule 15).

## Acceptance criteria

- [ ] `(integration)` a connecting client receives the protocol integer at the handshake
- [ ] `(integration)` the handshake succeeds with no session and no credential present
- [ ] `(integration)` a handshake payload failing the `libs/contracts` schema is rejected with a `code`
- [ ] `(integration)` a socket error reply carries the correlation id of the message that caused it
- [ ] `(integration)` the connection stays open after an error reply
- [ ] `(unit)` the socket filter and the HTTP filter emit the same `code` for the same error

## References

- `stack-api.md` rule 15 — the protocol integer the client hard-codes.
- `stack-api.md` rule 47 — `.meta({ id })` on every reusable schema.
- `architecture-api.md` rules 24, 45 — the decision-free entrypoint, the socket filter.
- `naming.md` rule 15 — the error `code` spelling.
- `requirements.md` `FR.10.3`, `FR.10.4`, `FR.11.1`, `FR.11.4`, `FR.13.2`,
  `FR.13.3`, `FR.3.2` (the session check this handshake deliberately defers).

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
