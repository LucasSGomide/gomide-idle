# 07 — The socket client and the out-of-date screen

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** 04

## Context

- `transport/` is the only place Socket.IO is imported, so no feature ever holds a
  socket.
- The client speaks to `01`'s unauthenticated handshake and compares the protocol
  integer and nothing else. There is no content-pack version check here.
- `stack-web.md` rule 22 is a refusal, not a degradation: on a mismatch the client
  stops and says so, rather than running against a protocol it does not speak.
- The socket is a same-origin relative path, like the API, so nothing about the
  host is compiled into the client.

## User experience

- **Flow** — the handshake runs behind the shell; a matching protocol leaves the
  screen untouched and shows nothing extra.
- **States** — protocol mismatch: a full-screen "your client is out of date,
  reload" message, per `stack-web.md` rule 22.

## Technical details

- **Front-end** — add the socket client in `transport/`, the only file importing
  Socket.IO; `architecture-web.md` rules 6–13.
- **Web stack** — compare the handshake's protocol integer against the one
  hard-coded here and render the out-of-date screen on a mismatch;
  `stack-web.md` rule 22.
- **Front-end** — no content-pack version check; `architecture-web.md` rule 32.
- **Web stack** — the socket is a same-origin relative path, with no host
  compiled into the client.
- **Design** — the out-of-date screen is full-screen and sized against the
  Portuguese string.

## Acceptance criteria

- [x] `(integration)` the client connects to `01`'s unauthenticated handshake over a same-origin relative path and reads the protocol integer
- [x] `(unit)` a matching protocol leaves the shell rendered and shows nothing extra
- [x] `(e2e)` a mismatched protocol replaces the page with the full-screen out-of-date message
- [x] `(unit)` the out-of-date message renders through the catalogue in the mirrored language, without truncation in Portuguese
- [x] `(integration)` dependency-cruiser fails when a file outside `transport/` imports Socket.IO
- [x] `(unit)` nothing but the protocol integer is compared, and no content-pack version check runs

## References

- `stack-web.md` rule 22 — refusing to proceed on a protocol mismatch.
- `architecture-web.md` rules 6–13, 32 — the six folders, the import rules, and no
  content-pack version check.
- `design.md` — the visual system the out-of-date screen is drawn in.
- `requirements.md` `FR.10.3` — a socket connection carries the protocol version
  at its handshake, and the client refuses to proceed on a mismatch.
- `requirements.md` `FR.14.3` — no runtime configuration; same-origin relative
  paths.

## Implement with

`/web-feature`
