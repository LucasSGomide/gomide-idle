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


5. **The renderer owns one element and React never renders inside it.** Two
   systems writing the same DOM subtree is the failure this boundary exists to
   prevent.

6. **The arena event stream never enters React state.** React must not re-render
   at frame rate, so events travel from the transport to the renderer directly.

7. **Render deliberately in the past, behind a small buffer.** Holding both
   bracketing snapshots is what makes movement smooth instead of jittery, and
   the player never issues a combat command — editing gear or a gambit is not
   timing-sensitive — so the delay costs nothing.

8. **Snap rather than replay when far behind.** Playing back hours of hit flashes
   after a backgrounded tab is worse than showing the result — keep only the
   events with lasting visual state.

9. **Never invent an event the server did not send.** Extrapolate movement
   briefly if the buffer starves, then freeze and say so; a fabricated hit
   breaks the only guarantee the renderer offers.

10. **The gambit and targeting editors live in React, outside the renderer's
    element.** The player edits while the fight runs, so the two write to the
    same screen at the same time and must never share a DOM subtree — rule 5,
    with a live editor sitting on top of it.
