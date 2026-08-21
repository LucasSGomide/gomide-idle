# Front-end rules

Rules for anything front-end-shaped. `project.yml` points every
`**Front-end**` bullet in a roadmap item at this file.

Each rule is one imperative and one line of why. A rule with no why is a
preference, and the next person will not know whether to keep it.

Numbered, because roadmap items cite them by number — renumbering breaks the
citations, so append rather than reorder.

1. **The renderer reads state and consumes events; it never computes a rule.**
   The moment the renderer knows a game rule, that rule exists in two places and
   the two will drift.

2. **Version the event stream, and fail loudly on an unknown version.** A stale
   client that silently renders nonsense is harder to diagnose than one that
   refuses to start.

3. **Placeholder art is acceptable at any stage; a renderer that owns a rule is
   not.** Art has lead time and can be swapped late — a coupled renderer cannot.

4. **The client's state is a cache, never the truth.** It is a view of what the
   server last said, so anything derived from it is a display value, not a
   decision.

