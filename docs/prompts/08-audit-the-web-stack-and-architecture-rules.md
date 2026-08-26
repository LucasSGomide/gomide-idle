# Goal: Audit `docs/stack-web.md` and `docs/architecture-web.md`, then extend them so the front-end has rules for how ordinary application code is organized — injected ports, a router, a folder structure, tests and failure states

**Status:** not executed
**Rating:** —
**Run:** standalone, but must run before any web code is written — these are the standards that code will be judged against. Read `docs/architecture-api.md` first; the back-end went through this exact pass on 2026-08-26 (prompt 07) and the web rules should reuse its vocabulary rather than invent a parallel one.

## Context

gomide_idle is a browser idle RPG. The front end is React 19 on Vite 8, TypeScript,
TanStack Query for everything the server owns, and a PixiJS canvas for the arena.
**There is zero application code so far** — the web app has not even been scaffolded.
These rules are being written *before* the code they govern, so there is no legacy to
accommodate and no excuse for a rule that exists only because something was already
built that way.

The two web rule docs were written while the app was still hypothetical, and it shows:

- **`docs/stack-web.md`** is 37 numbered rules, and roughly thirty of them are about the
  renderer, the event stream, sprites and assets. They are good rules. They are also
  answers to questions nobody asks until the app already exists.
- **`docs/architecture-web.md`** is thirteen lines of unnumbered prose covering two
  things: dependency direction, and the renderer boundary. That is it.

What neither doc says is how *ordinary* front-end code is written here. Where does a
file go. How does a component get its data. How does a screen become a URL. What is
tested and with what. What the player sees when a fetch fails or the socket drops. A
developer sitting down to write the character sheet today would have to invent all of
it, and the next developer would invent it differently.

The back end just closed the same gap. `docs/architecture-api.md` was numbered and
extended from unnumbered prose to 86 rules, and `docs/naming.md` took the naming
conventions. **This prompt is that pass for the web**, and it should feel like the same
project when it is done — same voice, same numbering discipline, and the same
port/adapter vocabulary where the idea is genuinely the same one.

Four decisions are already made and are listed as constraints below. They are not open
for re-argument. One of them contradicts an existing rule head-on: **`stack-web.md` rule
3 says "add a router only when a screen needs a shareable URL", and that is now
reversed** — the router goes in from the first screen. Part of this job is repairing that
rule and everything downstream of it, not quietly appending a rule that fights it.

## Constraints

1. **Read before writing anything.** `docs/stack-web.md`, `docs/architecture-web.md`,
   `docs/architecture-api.md` (especially the port/adapter, repository/DAO and testing
   sections — the web side should reuse that vocabulary where the idea is the same),
   `docs/naming.md`, `docs/design.md`, `docs/design-tokens.json`, `alpha.md`, and the two
   research docs the web rules cite: `docs/research/web-stack-2026-08.md` and
   `docs/research/renderer-2026-08.md`.

2. **Number `docs/architecture-web.md` as part of this pass.** It is unnumbered prose
   today. Number the existing rules first, preserving their current wording and order,
   then append the new ones — exactly how `architecture-api.md` was numbered on
   2026-08-26. After this pass the numbering is permanent and append-only: roadmap items
   cite rules by number and renumbering breaks the citations.

3. **Split the new rules by kind, and say nothing twice.**
   - `docs/architecture-web.md` — structure and dependency direction. What may import
     what, where a thing lives, which layer is allowed to know about which.
   - `docs/stack-web.md` — tool and library choices. Which router, which test runner,
     which build step.

   Where a rule needs both halves, put the rule in one file and cite it by number from
   the other rather than restating it.

4. **Decision one, settled: dependencies reach components through injected ports and
   feature hooks.** A provider at the app root holds the ports — the generated API
   client, the socket, the clock, and anything else that is a boundary to the outside
   world. Feature hooks read the ports and are the only thing a component calls. A
   component never imports an API client, a socket, `fetch`, or `Date.now()`.

   ```ts
   // app root
   <PortsProvider value={{ api, socket, clock }}>

   // features/character/use-character.ts
   export function useCharacter(id: string) {
     const { api } = usePorts();          // injected
     return useQuery({
       queryKey: ['character', id],
       queryFn: () => api.getCharacter(id),
     });
   }

   // components/CharacterSheet.tsx
   const { data } = useCharacter(id);     // no client import

   // test
   render(<PortsProvider value={{ api: fakeApi }}>…)
   ```

   Write the rules that make this hold: what counts as a port, who is allowed to build
   one, that a test swaps a port by wrapping the provider and never by mocking a module,
   and how the query-key convention works so two features cannot collide. Say explicitly
   how this relates to `stack-web.md` rule 7's `RendererPort` — it is the same idea
   pointed at the canvas, and the docs should either unify the two or state plainly why
   the renderer's port is not injected through the same provider.

5. **Decision two, settled: TanStack Router from the first screen, file-based routes.**
   Routes are generated from files under `routes/`. Loaders are for auth guards and
   prefetching only — every fetch still goes through a TanStack Query hook, so
   `stack-web.md` rule 2 stays true and there is exactly one cache.

   ```
   routes/
     __root.tsx
     _authed.tsx                # guard
     _authed/characters.tsx
     _authed/hunt.$huntId.tsx
   ```

   ```ts
   export const Route = createFileRoute('/hunt/$huntId')({
     loader: ({ context, params }) =>            // prefetch only
       context.queryClient.ensureQueryData(huntQuery(params.huntId)),
     component: HuntScreen,
   });
   ```

   Then repair the damage:

   - **Rewrite `stack-web.md` rule 3 in place** and mark the revision inline, the way
     rules 10, 12 and 17 were revised. Do not renumber and do not delete the old
     reasoning — a reader should be able to see that the "tab value is enough" argument
     was made and then dropped, and why.
   - **Sweep every other live doc for the no-router assumption** and fix each one.
     `docs/design.md` is known to carry it ("for now, no router — a tab value is enough
     for six screens"). Grep for it rather than trusting that list. Executed prompt files
     under `docs/prompts/` are historical records — leave them alone.
   - Check `stack-web.md` rule 4's "do not add" list still says what you want it to say
     once a router is in.

6. **Decision three, settled: the folder structure is feature-first, and this is the
   tree.**

   ```
   apps/web/src/
     routes/                 # TanStack Router file routes
     features/
       character/            # components, hooks, query keys for one screen-area
       hunt/
       inventory/
       gambit/
     renderer/               # Pixi and the RendererPort — no React, no game rule
     transport/              # socket client, event decoding
     ports/                  # PortsProvider, usePorts
     ui/                     # copied-in primitives (button, tooltip, …)
     lib/                    # generated api client, config, utils
   ```

   The tree alone is not a rule. Write the import rules that keep it honest and give each
   one its why: a feature does not import another feature; `ui/` knows nothing about any
   feature; `renderer/` contains no React and no game rule (this one already exists as
   prose — number it and point the folder at it); `lib/` is the only place the generated
   client is touched. Say what happens when two features need the same thing, because
   that is the moment this structure either holds or rots.

7. **Decision four, settled: three more areas get rules in this pass.**

   - **Testing and tooling.** Pick the runner and the testing library for the web side
     and justify the pick on its own terms. State what is actually worth testing — the
     ports seam, the projection and depth-sort maths from rule 10, the event buffer from
     rules 18–21, hooks rendered without a browser — and what is not. `stack-api.md` rule
     32 keeps Jest on the back end; if the web side lands somewhere else, that is two test
     runners in one repo and the rule must say so out loud (see constraint 9).
   - **Failure and loading states.** Where error boundaries sit, how a route distinguishes
     loading from empty, what happens when the socket drops, and what the player sees
     while it is down. `stack-web.md` rule 22 already refuses to start the renderer on a
     protocol mismatch — that is a failure state with a rule, and it should not be the
     only one.
   - **Design tokens and copy.** How `docs/design-tokens.json` reaches the Tailwind v4
     theme, whether a component may ever write a raw color, how a copied-in primitive
     (rule 25) is allowed to be modified, and whether user-facing strings are centralized
     or inline for the alpha.

8. **Client auth and runtime config are explicitly out of scope.** No rules about the
   session, route-guard internals beyond "the guard lives in one layout route", tokens,
   or how env vars are declared and validated — that material belongs with the auth doc
   and is being handled separately. Note both as deferred in the docs rather than
   inventing rules for them now.

9. **These four decisions are settled — write them down, do not re-argue them. But name
   what each one costs.** A rule whose why line only lists benefits is advertising. Where
   a decision has a real price — the router's codegen step and generated route tree, a
   second test runner in the repo, a provider that every test now has to wrap — name the
   price in the same breath as the rule. Do not both-sides it and do not reopen the
   choice.

10. **Do not invent rules for code that does not exist.** Every rule must trace back to
    something real in `alpha.md`, `docs/design.md`, the existing rule docs or the
    requirements table. A rule with no why is a preference, and these docs say so in their
    own headers.

11. **Match the house style.** One imperative, one line of why, numbered, append-only.
    Read `stack-api.md` and the newly extended `architecture-api.md` for the voice before
    writing. Plain words: "the socket client", not "the transport adapter layer". Where a
    real term of art is the right name — port, adapter, loader — use it once and define it
    in four words.

12. **Ask before you assume.** Constraints 4–7 fix the decisions but not every detail
    under them. Where a genuine choice is still open — a naming convention, a numeric
    value, which of two reasonable shapes a rule should take — use `AskUserQuestion`, or
    invoke the `msg-grill-me` skill for a fuller interview, rather than silently inventing
    an answer. One question at a time.

13. **`project.yml`, the `Makefile` and `scripts/roadmap-sync.mjs` are absent from the
    working tree as of 2026-08-26.** If the roadmap engine is back when you run this, run
    `make roadmap-check` and leave it passing, and check that `project.yml` still points
    the **Front-end** and **Web stack** areas at the two docs you edited. If it is still
    absent, say so in the summary instead of working around it.

## Tone

The voice these docs already use: plain words, short sentences, one idea each. No
hedging, no both-sidesing. Assume the reader knows TypeScript and React well, and knows
this game's mechanics not at all — so name a screen ("the gambit editor") rather than
assuming its shape is obvious.

## Output

Edits in place, no new planning docs:

- **`docs/architecture-web.md`** — numbered, then extended. Structure, dependency
  direction, the injected-ports rules and the folder-import rules. This is the main
  deliverable.
- **`docs/stack-web.md`** — rule 3 rewritten in place with the revision marked inline;
  new rules appended for the router, the test runner and the token pipeline.
- **Any other live doc that asserted there is no router** — repaired per constraint 5.

Finish with two short sections in the chat, not in the docs:

1. **What was decided under the settled decisions** — the details constraints 4–7 left
   open and how you closed them, so they are recoverable without re-reading the diff.
2. **Findings** — anything the audit turned up that this prompt did not ask about:
   contradictions between the two docs, rules that are now dead, rules that assume a DOM
   renderer that no longer exists, gaps you noticed and deliberately did not fill.
   Report them; do not act on them.
