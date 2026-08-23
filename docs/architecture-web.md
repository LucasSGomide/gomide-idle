# Front-end rules

Rules for anything front-end-shaped. `project.yml` points every
`**Front-end**` bullet in a roadmap item at this file.

These are architecture principles only — constraints on code structure and on
how the renderer, React and the transport are allowed to talk to each other.
Functional requirements, user needs and tuning notes that used to live here
have moved to [`alpha.md`](../alpha.md)'s Functional Requirements, User Needs
and Notes tables.

## Dependency direction

The renderer reads state and consumes events; it never computes a rule. The
moment the renderer knows a game rule, that rule exists in two places and the
two will drift.

The client's state is a cache, never the truth. It is a view of what the
server last said, so anything derived from it is a display value, not a
decision.

## Renderer boundary

The renderer owns one element and React never renders inside it. Two systems
writing the same DOM subtree is the failure this boundary exists to prevent.

The arena event stream never enters React state. React must not re-render at
frame rate, so events travel from the transport to the renderer directly.

The gambit and targeting editors live in React, outside the renderer's
element. The player edits while the fight runs, so the two write to the same
screen at the same time and must never share a DOM subtree.
