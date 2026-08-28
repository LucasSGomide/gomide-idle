# 03 — The normalised error shape, the log shape and observability

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** 02

## Context

- `UN.13` wants one shape for every error and every log line fixed **before** the
  first feature writes one. Retrofitting either is the thing this slice exists to
  prevent.
- All three concerns are bootstrap wiring in `main.ts` and the app module, which
  is why they ship together rather than as three slices.
- Only the HTTP half of the exception filter ships here. Its socket twin needs a
  gateway, and arrives with one in task `06`.
- The web renders an error from its `code` and never from the server's message
  (`FR.13.3`), so the `code` is a contract from the first one written.
- **Open risk, carried from the roadmap item:** `@nestjs/observe` is `0.1.8`
  (`stack-api.md` rule 43), published the day before that rule, under an API that
  can still move — and NestJS 12's `instrument` bootstrap option has been
  exercised nowhere in this repository. `FR.21.2` is the containment: with
  credentials absent the agent sends nothing, so a broken agent cannot take
  development or CI down with it.

## Technical details

- **Back-end** — one exception filter normalising every HTTP response to
  `{ statusCode, code, message }`, where `code` is machine-readable and `message`
  is for developers (`FR.13.1`, `architecture-api.md` rules 37, 45).
- **Naming** — an error `code` is `SCREAMING_SNAKE_CASE` naming the situation and
  never the HTTP status: `EMAIL_TAKEN`, not `CONFLICT` (`naming.md` rule 15).
- **Back-end** — `pino-http` registered in Fastify's `onRequest` hook, so request
  context is initialised once before any handler runs (`stack-api.md` rule 45,
  `FR.13.4`).
- **Back-end** — `timestamp`, `level`, `module`, `message` and the correlation id
  at the top level of a log line; everything else under `context`
  (`architecture-api.md` rules 48–55).
- **Back-end** — the logger is injected and never constructed in place
  (`FR.13.4`).
- **Back-end** — no password, token, session id or e-mail address ever reaches a
  log line; the redaction ships with the log shape rather than being remembered
  per feature (`architecture-api.md` rule 51).
- **API stack** — `@nestjs/observe` wired through NestJS 12's `instrument`
  bootstrap option in `main.ts` and the app module, reading `appKey` and
  `appSecret` from the environment schema task `02` created
  (`stack-api.md` rules 43–44, `FR.21.1`).
- **API stack** — the agent carries traces, runtime metrics and profiles; log
  lines are the logger's job and do not travel through it (`FR.21.4`).

## Acceptance criteria

- [ ] `(integration)` a thrown expected error returns exactly `{ statusCode, code, message }` and no other key
- [ ] `(integration)` an unexpected error returns the same three keys, with no stack trace and no driver detail in the body
- [ ] `(unit)` an error `code` naming an HTTP status rather than a situation fails the convention check
- [ ] `(integration)` a request log line carries `timestamp`, `level`, `module`, `message` and the correlation id at the top level, with every other field nested under `context`
- [ ] `(integration)` two concurrent requests carry two different correlation ids, and each handler's log lines carry its own
- [ ] `(unit)` the logger is injected, and a logger constructed inside a use case fails the check
- [ ] `(integration)` a request carrying a password, a token, a session id and an e-mail address logs none of the four
- [ ] `(integration)` with `appKey` and `appSecret` absent, start-up succeeds and the agent sends nothing
- [ ] `(integration)` with both present, the agent is registered through the `instrument` bootstrap option

## References

- `architecture-api.md` rules 37, 45 — the two error categories and the filter.
- `architecture-api.md` rules 48–55 — the logging rules.
- `stack-api.md` rules 43–44 — `@nestjs/observe` and what it does not carry.
- `stack-api.md` rule 45 — `pino-http` in the `onRequest` hook.
- `naming.md` rule 15 — the error `code` spelling, and the SQLSTATE collision.
- `requirements.md` `UN.13`, `FR.13.1`, `FR.13.3`, `FR.13.4`, `UN.21`,
  `FR.21.1`, `FR.21.2`, `FR.21.4`.

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
