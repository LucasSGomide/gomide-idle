# 01 — The pnpm workspace, the library packages and the lint gate

**Roadmap:** [01](../../roadmap/01-the-api-foundation.md) · **Scope:** back-end · **Depends on:** —

## Context

- The repository holds documentation and nothing else. This slice writes the
  first line of code in it.
- It owns what is repo-wide — the workspace, the linter, the CI workflow — so
  later slices and roadmap item `02` extend these files rather than creating a
  second set of them.
- All three libraries are scaffolded together, empty, so the package graph
  exists before dependency-cruiser's rules arrive in task `02`.
- `libs/simulation` declaring no dependency is a rule a machine enforces, not a
  habit. The `package.json` states it; task `02`'s boundary check is what keeps
  it true.
- **Open decision, carried from the roadmap item:** `stack-api.md` rule 41
  requires a test that fails if the `nestjs-zod` peer override's assertion is
  wrong. What that test asserts is undecided, and this slice decides it. The
  useful failure is the override outliving the reason for it — `nestjs-zod`
  moving to a `@nestjs/swagger` peer the override no longer covers.

## Technical details

- **API stack** — root `package.json` pinning Node 24; the floor is forced by the
  generated-code and test tooling, not chosen (`FR.9.6`).
- **API stack** — `pnpm-workspace.yaml` naming `apps/*` and `libs/*`, plus the
  `peerDependencyRules.allowedVersions` entry `stack-api.md` rule 41 requires for
  `nestjs-zod`'s `@nestjs/swagger ^11` peer.
- **API stack** — `libs/simulation`, `libs/content` and `libs/contracts` as empty
  ESM packages with Jest configured for ESM (`stack-api.md` rules 29–33,
  `FR.9.5`). All three are homes being placed, not populated.
- **API stack** — `libs/simulation` declares no runtime dependency at all
  (`FR.9.2`).
- **API stack** — oxlint over every package in the repository
  (`stack-api.md` rule 40, `FR.12.1`).
- **API stack** — a CI workflow running install, oxlint and Jest on every change.
  Later slices add type-checking, dependency-cruiser, the Postgres test tiers and
  the drift check to this same workflow (`FR.15.5`).
- **Naming** — this slice writes the first example of several conventions, and a
  wrong one is copied by every item after it (`naming.md` rules 2, 7–9).

## Acceptance criteria

- [ ] `(integration)` `pnpm install` on a clean clone resolves with no unmet-peer warning for `nestjs-zod`
- [ ] `(unit)` a test fails when the `@nestjs/swagger` range `nestjs-zod` actually declares falls outside the range the override asserts
- [ ] `(unit)` an ESM Jest spec in each of `libs/simulation`, `libs/content` and `libs/contracts` runs and passes
- [ ] `(unit)` `libs/simulation`'s manifest declares no `dependencies` entry, and the test fails if one is added
- [ ] `(integration)` oxlint runs over all three packages and exits zero
- [ ] `(integration)` installing on a Node below 24 fails, naming the engine requirement
- [ ] `(integration)` the CI workflow fails when oxlint fails, and when Jest fails

## References

- `stack-api.md` rules 29–33 — the workspace, the package split, Jest under ESM.
- `stack-api.md` rules 40–41 — oxlint, and the peer override with its test.
- `architecture-api.md` rule 23 — deployables in `apps/`, shared code in `libs/`.
- `naming.md` rules 2, 7–9 — file suffixes, `Port`, `FooType`, use-case inputs.
- `requirements.md` `FR.9.1`, `FR.9.2`, `FR.9.5`, `FR.9.6`, `FR.12.1`, `FR.15.5`.

## Implement with

_No implementation skill is configured for this project — implement against the
References above._
