# Goal: Rewrite `README.md` as the repo's operating guide — the folder map, the full setup, mermaid sequence diagrams of every route, the socket layer, and how to watch the running app in the observe.nestjs.com dashboard and the Better Auth console

**Status:** not executed
**Rating:** —
**Run:** standalone. Nothing depends on it and it depends on nothing.

## Context

`README.md` still describes a repo with no code in it. It says **"Status: design
only. No code yet."**, lists the planning docs, and carries a **Superseded**
section about two design docs deleted in August 2026. All of that was true when
it was written and none of it is true now.

What is in the repo today: a pnpm workspace with a NestJS API (`apps/api`), a
React + TanStack Router web app (`apps/web`), three shared libraries
(`libs/contracts`, `libs/content`, `libs/simulation`), a `Makefile` that already
holds every command a developer needs, Postgres in `docker-compose.yml`, five
HTTP routes, a websocket gateway, Better Auth sessions in the project's own
Postgres, and an observability agent that is wired but dormant.

The reader is **Lucas, six months from now**, with nothing remembered. So the
README must be self-contained for two things — *how do I run this* and *how does
it actually work* — and must **link** into `docs/` for the rules rather than
copying them. It is a guide, not a second rule doc.

Four things the reader cannot currently reconstruct without reading source, and
that this pass exists to fix:

1. **What each folder is for.** Seven top-level folders and, inside `apps/api`,
   a four-layer module shape (`entrypoint/` → `application/` → `domain/` →
   `infrastructure/`) that is never explained anywhere a newcomer would look.
2. **How to go from a clone to a running game.** The `Makefile` has the
   commands; nothing says which ones, in which order.
3. **What happens on each route.** Five HTTP routes and two socket messages,
   with guards, use cases, Better Auth and Postgres behind them.
4. **How to look at the running system.** Two hosted consoles are relevant —
   the NestJS observability dashboard at <https://www.observe.nestjs.com/> and
   Better Auth's own console — and neither has a single line written about it in
   this repo.

**The observability agent is already wired and deliberately off.**
`apps/api/src/observability/observability.ts` imports `@nestjs/observe` and
returns an empty wiring unless **both** `OBSERVE_APP_KEY` and
`OBSERVE_APP_SECRET` are set. With them absent no worker starts and nothing is
sent (`stack-api.md` rules 43–44, FR.21.1–21.2, 21.4). `forwardLogs: false` is
set on purpose: log lines are pino's job and never travel through the agent.
`.env.example` already declares the four `OBSERVE_*` variables with empty
credentials. So the README's job here is **not** to wire anything — it is to
explain the switch, and what appears in the dashboard once it is flipped.

**Better Auth is fully configured but nobody has looked at it from outside.**
`auth.options.ts` sets email + password, 30-day sliding sessions, no e-mail of
any kind, and `telemetry: { enabled: false }`. The tables are generated into
`apps/api/src/modules/auth/infrastructure/database/schema/auth.schema.ts` by
`make api-auth-schema` and migrated by drizzle-kit. Whether Better Auth's hosted
console can see this project, and what it would take, is an open question this
pass must **answer from their documentation, not from memory** — including the
honest answer "it needs X, which this project does not have".

## Constraints

1. **Read the repo before writing a word of the README.** At minimum:
   `Makefile`, `docker-compose.yml`, `.env.example`, `package.json` +
   `pnpm-workspace.yaml`, `apps/api/src/` (especially `main.ts`,
   `bootstrap.ts`, `app.module.ts`, `config/env.ts`, `observability/`,
   `realtime/`, `logging/`, and every file under `modules/auth/` and
   `modules/system/`), `apps/web/src/` (`main.tsx`, `routes/`, `features/`,
   `transport/`, `lib/api/`), `libs/*/src/index.ts`, and `project.yml`. Every
   command, path, route, env var and event name in the README must be one that
   exists. **Do not describe anything you have not opened.**

2. **Replace the README wholesale, with one exception.** The "Status: design
   only. No code yet." line, the game pitch, and the Superseded section all go.
   The **docs map survives** — keep a short section that points at `alpha.md`,
   `vision.md`, `docs/` and `project.yml` and says in one line each what they
   are for. Move the Superseded history into `docs/` as its own small file if it
   still seems worth keeping; do not leave it in the README. A one- or
   two-sentence "what this game is" opener stays, because a folder map with no
   subject is unreadable.

3. **Documentation only. Change no code, no config and no credentials.** No
   edits to `.env`, no real `OBSERVE_*` keys anywhere, no new Better Auth
   options, no new dependencies. If making the observability dashboard or the
   Better Auth console useful would require a code change, **say so in the
   README as a named gap** ("not wired yet: …") and stop there. The only file
   this pass writes is `README.md` — plus, optionally, the one small `docs/`
   file constraint 2 allows for the Superseded history.

4. **Fetch both hosted docs before writing their sections. Do not write these
   two sections from memory.**
   - <https://www.observe.nestjs.com/> and its documentation at
     <https://www.observe.nestjs.com/dashboard/documentation> — how to get an
     app key and secret, what `serviceId` and `endpoint` mean, what the
     dashboard actually shows for a NestJS app, and how to confirm data is
     arriving.
   - Better Auth's own documentation for its hosted console / dashboard — what
     it is, whether a self-hosted instance like this one can be connected, what
     it would need (a plugin? a project key? telemetry, which is currently
     off?), and what it would then show.

   If a page cannot be fetched or the feature does not exist as assumed,
   **write that plainly in the README** rather than inventing a plausible
   procedure. A wrong setup instruction costs more than a missing one.

5. **The setup section is a script a tired person can follow top to bottom.**
   Prerequisites (Node 24+, pnpm 11, Docker) → `make install` → `make env` →
   `make db-up` → `make migrate` → `make dev-all` → the two URLs that are now
   live → `make check` before committing. Prefer the `make` target over the raw
   `pnpm`/`docker` command every time — the Makefile is the interface, and its
   `make help` already lists everything. Include a short table of the targets
   worth knowing (setup, dev, database, generate, test, gates) rather than
   reprinting all of them.

6. **The folder map is a table, not prose.** Cover the top level (`apps/`,
   `libs/`, `docs/`, `scripts/`, `.claude/`, `Makefile`, `project.yml`) and then
   go one level deeper where it earns it:
   - `apps/api/src/` — `config/`, `logging/`, `errors/`, `observability/`,
     `realtime/`, `http/`, `modules/`.
   - **One module's four layers, explained once**, using `modules/system` or
     `modules/auth` as the worked example: `entrypoint/` takes the request,
     `application/` holds the use case, `domain/` holds the rules,
     `infrastructure/` talks to Postgres and to Better Auth. Say which way the
     arrows point and note that `make depcruise` is what enforces it.
   - `apps/web/src/` — `routes/`, `features/`, `lib/`, `transport/`, `ui/`,
     `renderer/`, and the three generated files (`routeTree.gen.ts`,
     `theme.ts`/`theme.css`, `lib/api/generated/`) marked as **never hand-edit**.
   - `libs/` — what each of the three is for and why they are shared.

   Give each row a **responsibility in one line**. Link the rule doc that
   governs it (`docs/architecture-api.md`, `docs/architecture-web.md`,
   `docs/stack-api.md`, `docs/stack-web.md`, `docs/auth.md`, `docs/naming.md`)
   instead of restating its rules.

7. **Three mermaid `sequenceDiagram` blocks, medium depth.** Group them:
   - **Auth** — `POST /auth/sign-up`, `POST /auth/sign-in`, `POST /auth/sign-out`,
     `GET /auth/session`. Show browser → controller → use case → Better Auth →
     Postgres, the session cookie, `SessionGuard`, and the sign-out path that
     closes the session's sockets.
   - **Server meta** — `GET /server-meta`: controller → use case → DAO →
     Postgres, and what the build id is for.
   - **Sockets** — the connection handshake (cookie → session → `handshake`
     frame, or a `NO_SESSION` error frame and disconnect) and the `server-meta`
     message over the socket.

   Each diagram gets **two to four sentences under it** saying what the route is
   for and when it fires. Keep participants to five or fewer per diagram — this
   is a picture, not a transcript. Verify every route path, event name and error
   code against the source; do not guess.

8. **The socket section explains the split, not just the events.** Four things
   the reader must come away with:
   - **Why the handshake is authenticated the same way HTTP is** — the same
     server-side session, read from the cookie, refused with a declared
     `NO_SESSION` error frame rather than a bare close.
   - **Who checks `Origin`** — the adapter (`OriginCheckedIoAdapter`), not CORS,
     which is why `@WebSocketGateway()` carries no `cors` option, and which env
     var drives it (`SOCKET_ALLOWED_ORIGINS`).
   - **The protocol version** — what `SOCKET_PROTOCOL_VERSION` in
     `libs/contracts` is for and what a stale client does.
   - **The error twin** — a bad socket message returns the same `code` an HTTP
     error would and the connection stays open; and `SessionCloseBus` +
     `SessionSocketRegistry` are how deleting a session disconnects its live
     sockets immediately.

9. **Observability and Better Auth each get their own section, written as "here
   is how you go and look".** For observability: what the agent is, the exact
   env vars, the fact that it stays silent with no credentials, that logs do not
   go through it (pino writes them; say where they land locally), and the steps
   to see this service in the dashboard. For Better Auth: where the config
   lives, that the schema is generated by `make api-auth-schema` and migrated by
   drizzle-kit, what the four tables are, how to inspect them locally with
   `make db-studio`, and what their console can and cannot show for this
   project. Both sections end with **"how you know it worked"** — the concrete
   thing you look at.

10. **Do not invent a feature.** The game has accounts, a session, a character
    list route and a server-meta endpoint. There is no hunting, no combat, no
    loot in the code yet. Where the README needs to say what is coming, point at
    `docs/roadmap/` and stop.

11. **Every link must resolve.** Relative paths for repo files, absolute URLs
    for the two hosted consoles. Check the files exist before linking them.

## Tone

Teacher explaining to a beginner who will not read a wall of text. **Concise but
clear — short sentences, one idea each, plain words.** Lead with the point, then
the detail.

- Assume solid TypeScript and backend knowledge, and **zero memory of this
  repo** and zero game-development background. Any game term gets four words of
  definition on first use, never an abbreviation.
- Same for the architecture words: say what a *guard*, a *use case*, a *DAO*, a
  *gateway* and a *port* are, once, in four words each, where they first appear.
- Prefer a table or a numbered list over a paragraph. Prefer a diagram over a
  description of a diagram.
- No marketing, no hedging, no "simply" or "just". If something is fiddly, say
  it is fiddly and say why.
- Every section should be skimmable: a bold lead line, then the detail under it.

## Output

**`README.md`**, rewritten in place. Suggested section order — adjust if a
better one emerges while writing, but keep all of it:

1. What this is — two sentences, plus the docs map (constraint 2).
2. Get it running — prerequisites, the ordered setup, the URLs.
3. The commands worth knowing — Makefile table.
4. The folder map — what lives where and what it is responsible for.
5. How a request flows — the three mermaid diagrams and their explanations.
6. The socket layer.
7. Watching it run — observability dashboard, then Better Auth.
8. Where to look next — `docs/roadmap/`, the rule docs, `make roadmap-check`.

Optionally **one small `docs/` file** for the Superseded history, per constraint 2.

Finish with a short **Findings** section in the chat, not in the README:
anything the pass turned up that it was not asked about — a stale command, a doc
that contradicts the code, a wiring gap the two consoles need. Report them; do
not fix them.
