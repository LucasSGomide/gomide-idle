# 01 — The web app scaffold, its six folders and the boundary checker

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** —

## Context

- `apps/web` does not exist yet. Roadmap item `01` already created the pnpm
  workspace, the linter, the boundary checker, the regenerate command and the CI
  workflow, so this slice adds the web into them rather than writing a second set.
- The six-folder shape is the constraint every later slice sits inside. It is
  policed by dependency-cruiser from the first commit, because a boundary rule
  added after features exist is a rule that gets negotiated instead of enforced.
- `renderer/` is created empty here. It has its own rule — nothing may import into
  it but the generated theme module — and that rule is cheapest to encode while
  the folder is still empty.
- Nothing renders in this slice. The first screen arrives in task `04`.

## User experience

- **States** — nothing renders. This slice ships no route and no markup; the shell
  and its top bar arrive in task `04`.

## Technical details

- **Front-end** — scaffold `apps/web` on React 19, Vite 8 and TypeScript, giving
  `src/` exactly `routes/`, `features/`, `renderer/`, `transport/`, `ui/` and
  `lib/`, and nothing beside them but the entry point.
- **Front-end** — no feature imports a feature, `ui/` knows no feature, and
  nothing imports into `renderer/` but the generated theme module;
  `architecture-web.md` rules 6–13, 27.
- **Web stack** — React 19 on Vite 8 with Vitest, jsdom configured only where
  something renders; `stack-web.md` rules 1–3, 41, 44.
- **Web stack** — add the web's type-check, Vitest and dependency-cruiser jobs to
  `01`'s existing CI workflow rather than a second workflow.

## Acceptance criteria

- [x] `(integration)` `pnpm build` in `apps/web` produces a Vite bundle from the TypeScript entry point
- [x] `(unit)` a placeholder component renders under Vitest with jsdom, proving the runner and the environment are wired
- [x] `(integration)` dependency-cruiser run from `apps/web` passes on the empty six-folder tree
- [x] `(integration)` dependency-cruiser fails when a file in one feature imports from a sibling feature
- [x] `(integration)` dependency-cruiser fails when a file in `ui/` imports from `features/`
- [x] `(integration)` dependency-cruiser fails on an import into `renderer/` that is not the generated theme module
- [x] `(integration)` dependency-cruiser fails on a seventh folder added under `src/`
- [x] `(integration)` the CI workflow runs the web's type-check, Vitest and dependency-cruiser jobs on a change under `apps/web`

## References

- `architecture-web.md` rules 6–13, 27 — the six folders and the import rules.
- `stack-web.md` rules 1–3 — React 19, Vite 8, TanStack Query and Router.
- `stack-web.md` rules 41, 44 — Vitest, and jsdom only where something renders.
- `requirements.md` `FR.12.2` — the dependency check that fails on an outward
  import between layers, a cross-import between sibling features, or any import
  into `renderer/` other than the generated theme module.

## Implement with

`/web-feature`
