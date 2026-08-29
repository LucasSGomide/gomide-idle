# Goal: Finish the rename — retire `gomide` and `gomide_idle` from the repo's plumbing so the only name anywhere is _Tormented Path_

**Status:** not executed
**Rating:** —
**Run:** any time. Depends on nothing. Ends with two commands for Lucas to run
by hand, so do not start it in the middle of other work.

## Context

The game has a real name. It was decided on 2026-08-28 and written into
[`docs/naming.md`](../naming.md) as rule 16: the game is **Tormented Path**, and
its live content is one **season** at a time, currently **Mortal Ways**. A
_season_ is the game's current era of content — the rule reserves the word and
nothing more.

**Half of that rename already happened, and it is the half a player sees.**
`GAME_NAME` in [`apps/web/src/lib/brand.ts`](../../apps/web/src/lib/brand.ts),
the browser tab title, the OpenAPI document title, the generated API client
file name, the design tokens, the observability service id — all already say
Tormented Path.

**The other half never happened, and it is the half a developer sees.** The
repository still calls itself `gomide_idle`. Its five workspace packages still
live under the `@gomide/*` scope, so every import line in the back end reads
`from '@gomide/contracts'`. The local database, its user and its password are
all the string `gomide`. The README's first line is `# gomide_idle` directly
above a paragraph that introduces the game as Tormented Path.

That contradiction is the whole job. Nothing here changes behaviour — every
edit is a name — but names are load-bearing in four places that will bite if
they are changed carelessly:

1. **The package scope is in the module resolver.** `@gomide/contracts` is
   resolved by three separate mappings that must agree: TypeScript `paths` in
   `apps/api/tsconfig.json`, Jest's `moduleNameMapper` in
   `apps/api/jest.config.mjs`, and pnpm's workspace links from each
   `package.json`. Change one and not the others and the build breaks in a way
   the error message does not explain.

2. **Two files that mention the scope are generated, not written.**
   `apps/web/src/theme.css` and `apps/web/src/theme.ts` carry
   `pnpm --filter @gomide/web` inside a header that says *do not edit by hand*
   ([`docs/stack-web.md`](../stack-web.md) rule 45). The name lives in the
   generator, [`apps/web/scripts/theme/tokens-to-theme.ts`](../../apps/web/scripts/theme/tokens-to-theme.ts).
   Fix it there and regenerate.

3. **The database rename destroys the local volume's usefulness.** Postgres
   creates its user and database once, on first boot of an empty data volume.
   Changing `POSTGRES_USER` in `docker-compose.yml` does nothing to a volume
   that already exists — the container keeps the old role, the new
   `DATABASE_URL` fails to authenticate, and the error looks like a password
   problem. The fix is `make db-reset`, which drops the volume and re-applies
   migrations. It throws away local data, which is fine here and must be
   written down for the next person.

4. **`lucas-gomide` is a different word that happens to contain `gomide`.** It
   is Lucas's own username: his home directory (`/home/lucas-gomide/…`) and his
   npm scope (`@lucas-gomide/msg-cli` in `pnpm-lock.yaml`). A careless
   find-and-replace corrupts absolute paths across `.claude/` and the lockfile.

### What is left, in full

This inventory was taken on 2026-08-29. Verify it — do not trust it — but
nothing should be outside it.

| Where | What it says now | Notes |
| --- | --- | --- |
| `package.json` | `"name": "gomide-idle"`, two `--filter @gomide/*` scripts | root manifest |
| `apps/api/package.json`, `apps/web/package.json`, `libs/{contracts,simulation,content}/package.json` | `@gomide/<pkg>` names, and the `@gomide/contracts` workspace dependency | five packages |
| `Makefile` | eleven `pnpm --filter @gomide/*` invocations | |
| `apps/api/tsconfig.json` | `paths` for `@gomide/contracts` and `@gomide/contracts/*` | |
| `apps/api/jest.config.mjs` | `moduleNameMapper` for `^@gomide/contracts$` | |
| `apps/api/src/**`, `apps/api/test/**` | ~15 `from '@gomide/contracts'` imports | |
| `libs/{contracts,simulation,content}/src/index.spec.ts` | `describe('@gomide/…')` | |
| `apps/web/scripts/theme/tokens-to-theme.ts` | two generated-header lines naming `@gomide/web` | generator, then regenerate |
| `apps/web/src/theme.css`, `apps/web/src/theme.ts` | the generated output of the above | never hand-edit |
| `docker-compose.yml` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, the `pg_isready` healthcheck | all `gomide` |
| `.env.example` | `DATABASE_URL=postgres://gomide:gomide@localhost:5432/gomide` | |
| `README.md` | `# gomide_idle` on line 1 | |
| `.claude/settings.local.json` | an absolute path ending `/gomide_idle` | |
| `pnpm-lock.yaml` | the old package names | regenerate, never hand-edit |

## Constraints

1. **Use exactly these forms. No variants.**

   | Thing | New value |
   | --- | --- |
   | Display name, in prose | `Tormented Path` |
   | Slug — package names, folders, file names | `tormented-path` |
   | Workspace scope | `@tormented-path/api`, `/web`, `/contracts`, `/simulation`, `/content` |
   | Root package name | `tormented-path` |
   | Postgres user, password, database | `tormented_path` — underscores, because an unquoted Postgres identifier cannot contain a hyphen |

2. **Never touch `lucas-gomide`.** Not in `.claude/`, not in `pnpm-lock.yaml`,
   not in any absolute path. And leave the git remote alone: it is still
   `git@github.com:LucasSGomide/gomide-idle.git`, renaming the GitHub
   repository is Lucas's call and is out of scope for this prompt.

3. **Do not rewrite the archived docs.** These five prompt files and one
   research report were written before the game had a name, and they are
   records of what was actually said at the time:

   - `docs/prompts/01-research-component-based-architecture.md`
   - `docs/prompts/04-compare-threejs-and-pixijs-and-pick-the-alpha-renderer.md`
   - `docs/prompts/06-define-the-ui-design-specification.md`
   - `docs/prompts/07-adapt-the-disabled-skills-into-project-backend-standards.md`
   - `docs/prompts/08-audit-the-web-stack-and-architecture-rules.md`
   - `docs/research/component-architecture-2026-08.md`

   Instead, add **one** sentence to `docs/prompts/README.md` saying that
   prompts written before the rename call the project `gomide_idle`, and that
   it means Tormented Path. Nothing more — no per-file banners, no footnotes.

4. **Do not spell the game's name in web app code.** `naming.md` rule 16 says
   `GAME_NAME` in `apps/web/src/lib/brand.ts` is the one place the string
   `Tormented Path` is written, so that a later version changes it in one edit.
   This rename touches package names, config and comments — never a new user-
   facing literal. If a place seems to need one, it needs `GAME_NAME` instead.

5. **Regenerate what is generated; never hand-edit it.** After changing the
   theme generator and the package names, run `make generate` for the theme,
   route tree, OpenAPI document and Orval client, and `pnpm install` to rewrite
   `pnpm-lock.yaml` against the new workspace names. `docs/stack-web.md` rule 45
   is the rule being obeyed here.

6. **Change the database in one move, and document the reset.** The
   `docker-compose.yml` values, the `.env.example` `DATABASE_URL` and the
   README's setup section change together. The README must tell a reader with an
   existing checkout to run `make db-reset` once after pulling this change, and
   say plainly that it drops local data. If a local `.env` exists, tell Lucas the
   line to change — do not edit `.env` yourself.

7. **Fix the repository's own identity, but do not move the folder.** Set the
   root package name, fix the README's first line, and update the absolute path
   inside `.claude/settings.local.json` to end in `tormented-path`. The
   directory move itself is Lucas's to run: an agent cannot move the directory
   it is running inside, and its own working directory would vanish mid-run.

8. **Prove it is finished with a grep that returns nothing.** After the edits,
   this must print no lines:

   ```bash
   grep -rniE 'gomide' . \
     --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
   | grep -v 'lucas-gomide' \
   | grep -v '^\./docs/research/' \
   | grep -v '^\./docs/prompts/0' \
   | grep -v 'gomide-idle\.git'
   ```

   Then run `make check` (lint, format, typecheck, dependency boundaries, unit
   and Postgres integration tests), `make build`, and `make roadmap-check`. All
   green, or the prompt is not done. Report failures honestly rather than
   working around them.

9. **Commit only this rename.** Other sessions have work in progress in this
   repository. Do not commit, amend, or discard anything that is not part of the
   rename, and do not push or land anything.

## Tone

Write like a patient teacher explaining to a smart beginner who is busy. This
applies to the chat and to every line written into a file.

- Short sentences, one idea each, plain words. Lead with the point.
- Define a term on first use in about four words — a _workspace scope_, a
  _module resolver_, a _data volume_.
- Show the before and after line rather than describing the difference.
- No hedging, no "simply", no "just". If a step is fiddly, say so and say why.

## Output

The deliverable is the renamed repository, on its own branch, with every check
green. Then two things in the chat, not in a file.

**First, a short report:**

| Area | Files touched | Regenerated? |
| --- | --- | --- |
| Package scope | … | … |
| Database | … | … |
| Docs & config | … | … |

Name anything deliberately left alone and why, in one line each.

**Second, the handoff.** End with the exact commands for Lucas to run himself,
in order, and say what each one does:

```bash
mv ~/dev/personal/gomide_idle ~/dev/personal/tormented-path
# then reopen Claude Code in the new directory — its session state is keyed to
# the old path and does not follow the move

make db-reset   # drops the local Postgres volume, recreates it as
                # tormented_path, re-applies migrations. Local data is lost.
```

If a local `.env` exists, add the one `DATABASE_URL` line he must change.
