# 05 — Server-wide toggles: feature flags, maintenance mode and live-event switches

**Verdict:** viable, not yet spiked · **Opened:** 2026-08-28

> Opened out of the `system` module decision on roadmap item
> [`01`](../roadmap/01-the-api-foundation.md). Once a module exists that owns the
> running server rather than a game system, it is the obvious home for anything
> global that is switched rather than deployed. Recorded so the idea is not
> re-derived, and so it is not smuggled into `01` without a requirement.

## The idea

A row already read on every client start — `server_meta`, `FR.10.2` — could carry
more than three diagnostic values. Candidates raised:

- **Feature flags for live events.** Turn a seasonal event on without a deploy.
- **Maintenance mode.** One switch that puts the client on a held screen instead
  of letting it connect to an API that is mid-migration.
- **Kill switches.** Disable one game system — a hunt exploit found in
  production — without shipping a build.
- **Minimum client version.** Distinct from `stack-api.md` rule 15's protocol
  integer, which is a hard refusal; this would be a soft "you are behind".

## What is committed today

Nothing here. `requirements.md` has no user need and no functional requirement
mentioning flags, toggles, maintenance or events; the file was grepped on
2026-08-28. Roadmap item `01` ships `server_meta` with exactly the three columns
`FR.10.2` names, and `FR.10.4` is the reason: nothing on that path may be
present without a rule that already requires it.

Any of the above arrives through `msg-pre-roadmap` as its own user need, not as a
column added quietly to a table that already exists.

## What the existing rules already constrain

- **A soft minimum-version check fights `architecture-web.md` rule 32.** That rule
  refuses a second version integer beside the protocol one, because `apps/web`
  and `apps/api` ship from one repository and deploy together — the only window
  where they disagree is between a deploy and a tab reload. A "you are behind"
  state has no meaning while that stays true. It gains meaning only if the web
  ever ships independently of the API, which no requirement asks for.
- **A build id in `server_meta` cannot identify a running instance.** Every API
  process reads the same row, so the seeded value says which migration ran, not
  which container answered. Per-instance identification needs the build id in the
  process environment instead — which is roadmap `01`'s own first blocker, and is
  decided in its task `04`.
- **Flags are read state, so they follow the DAO path, not the repository one.**
  `architecture-api.md` rule 21 reserves the repository for the domain boundary,
  and a toggle has no aggregate behind it.
- **A flag read on every request needs a caching answer this project has not
  made.** `server_meta` is read once at client start; a kill switch consulted
  per request is a different access pattern and the first thing a spike would
  have to settle.

## Findings

The productive split is between **what the client is told once** and **what the
server consults continuously**. `server_meta` is the former and already exists;
flags, kill switches and maintenance mode are the latter, and sharing a table
with `server_meta` would be a coincidence of storage rather than a shared
purpose. Treating them as one thing is the mistake to avoid if this is ever
picked up.

The decision that actually mattered on 2026-08-28 was structural and is already
taken: `FR.9.7` gives `apps/api` a `system` module. That is what stops any of
this from later landing as loose app-level files outside the dependency-cruiser
boundary. The features themselves cost nothing to defer.
