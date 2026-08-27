# Goal: Close the six loose ends prompt 08 reported — the renderer boundary written twice, `stack-api.md` rule 32's now-false claim, the rules still arguing against a renderer that was cancelled, the canvas's untouched text, and the two places that never learned the game ships in English *and* Portuguese

**Status:** executed 2026-08-26 — `architecture-web.md` took ownership of the renderer boundary and gained rules 28–30 for text in the arena; `stack-web.md` revised rules 8, 12, 13, 17, 26 and 51 and appended 53–56; `stack-api.md` rule 32 was revised a second time; `design.md` gained §13 and arena-text edits in §§1, 2, 5, 6 and 9; `architecture-api.md` gained rules 87–88 and `naming.md` rule 13. Item F reversed mid-run at Lucas's instruction: content names are not translated, so there is no locale map and the back-end rules record that instead
**Rating:** —
**Run:** standalone, after [`08-audit-the-web-stack-and-architecture-rules.md`](08-audit-the-web-stack-and-architecture-rules.md). Read that prompt and the diff it produced first — every item below is something its own Findings section reported and deliberately did not act on.

## Context

Prompt 08 numbered `docs/architecture-web.md` and extended it to 27 rules, reversed
`docs/stack-web.md` rule 3 in favour of a router, and appended rules 38–52 for the
route codegen, Vitest, the generated Tailwind theme and internationalization.
Internationalization was not in that prompt's brief — it was added mid-run, which is
why several of the items below exist: a decision landed late and the docs around it
were never swept.

Eight findings were reported. Two are already closed and are recorded here only so
the list is not re-derived later:

- The roadmap engine was absent from the working tree when prompt 08 ran. It is
  back, `make roadmap-check` passes, and `project.yml` still points **Front-end** at
  `docs/architecture-web.md` and **Web stack** at `docs/stack-web.md`.
- `docs/auth.md` was absent. It is back — an intentional stub with no rules yet —
  and `architecture-web.md`'s deferral note now links it properly.

Six remain, listed below as A–F. **There is still zero web application code.** These
rules are being written before the code they govern, so no rule may exist because
something was already built that way.

### A. The renderer boundary is written twice

`architecture-web.md` rules 3 and 4 and `stack-web.md` rules 13 and 17 are the same
two rules, near-verbatim:

> 3. **The renderer owns one element and React never renders inside it.**
> 13. **The renderer owns one empty div and React never renders inside it.**

The duplication predates prompt 08; numbering both files is what made it visible.
Both files are append-only, so neither pair can be deleted or renumbered. Decide
which file owns the boundary and make the other pair a pointer, keeping all four
numbers alive.

### B. `stack-api.md` rule 32 now says something false

Rule 32 reads "Jest everywhere, including the framework-free packages", justified by
"one runner and one set of conventions **across the repo** beats a per-package
optimum", and closes with "picking Vitest now would mean running two runners until
that migration lands". `stack-web.md` rule 41 put Vitest on the web deliberately, so
the repo runs two runners today. The rule's scope is arguably still defensible —
`stack-api.md` governs the API stack — but its stated reasoning is not.

### C. Rules whose reasoning belongs to a renderer that was cancelled

Rules 6 and 34 killed the DOM renderer on 2026-08-24. Three rules still argue
against it, and each is still *true* while warning against something nobody can now
do:

- **Rule 8** — "Never choose or reject a renderer on sprite count." Its entire why is
  DOM node-count arithmetic: "~150 live nodes, or style-recalc above ~4ms per frame".
- **Rule 12** — "Drive the sprite frame index from the render loop, never from CSS
  `steps()`." Only a DOM renderer could have used `steps()`.
- **Rule 26** — "Keep `image-rendering: pixelated` scoped to sprites and the arena."
  Written as a CSS property; under PixiJS the equivalent is a texture scale mode, and
  the rule does not say so.

Decide per rule whether to revise in place or keep as written, and where a rule is
kept, say why it earns its place against a renderer that is not being built.

### D. Nothing governs text drawn inside the canvas

`alpha.md`'s live-hunt view requires floating damage numbers that distinguish
physical from fire from electric, and health bars over every entity.
[`docs/research/renderer-2026-08.md`](../research/renderer-2026-08.md) §5 records
that these are PixiJS `Text` and `BitmapText` — so they are user-facing strings and
numbers rendered *inside* the canvas.

They fall through every rule written so far. `stack-web.md` rule 46 forbids raw
colours in a component, but a Pixi text style is not a component and cannot use a
Tailwind utility. Rules 48–52 put every string through react-i18next, which the
renderer cannot reach — and `architecture-web.md` rule 10 keeps React out of
`renderer/` entirely. `design.md` §2 chose Rajdhani and Inter for the meta UI and
explicitly scoped itself out of the arena.

### E. `design.md` never learned the game ships in two languages

The design spec was written when the app was English-only, and nothing in it has
been revisited:

- §1's top bar has no language switcher, on any screen.
- §1's live-hunt column is a fixed `380px` holding the status panel and the gambit
  trace; §2's type scale and §5's toast, banner and button specs were all sized
  against English copy. Portuguese runs materially longer — "Start Hunt" against
  "Iniciar Caçada", "On cooldown" against "Em recarga".
- §11's copy rules are English-only in both their rules and their examples
  ("Start Hunt", not "Start"; "Enter a character name." not "Invalid input.").
  Whether a rule like verb-first survives translation is not addressed.
- §5's gambit trace shows a skip reason as text on every row, and §8 fixes the login
  summary's section order — both are copy-heavy in a fixed-width column.

### F. The back end has no locale map

`stack-web.md` rule 51 says a hunt, monster, skill, prefix or suffix name comes from
the content pack's locale map, and that `libs/content` validates it at load so a
missing language fails where a missing skill id already does. **Nothing on the back
end says that map exists.** `architecture-api.md` rule 11 ("content is data,
validated at load"), `stack-api.md` rule 31 (`libs/content` exports the JSON and the
validator together), and `naming.md` are all silent on it.

Separately, `docs/requirements.md` records no user need and no functional
requirement stating that the game ships in two languages at all — so the alpha's
requirement log does not know about a decision the stack rules now depend on.

## Constraints

1. **Read before writing anything.** `docs/stack-web.md`, `docs/architecture-web.md`,
   `docs/stack-api.md`, `docs/architecture-api.md`, `docs/naming.md`,
   `docs/design.md`, `docs/design-tokens.json`, `docs/auth.md`, `alpha.md`,
   `docs/requirements.md`, both research docs under `docs/research/`, and prompt 08
   itself. The rule numbers cited above are load-bearing; check each one still says
   what this prompt claims before acting on it.

2. **Numbering is permanent and append-only, in every rule doc.** Never renumber and
   never delete a rule. A rule that must change is rewritten in place with its
   revision marked inline and its old reasoning left visible — the way `stack-web.md`
   rules 3 and 10 and `stack-api.md` rules 12, 17 and 32 already are. A reader must be
   able to see what was believed before and why it was dropped.

3. **Where a rule is duplicated, one file owns it and the other cites it by number.**
   Do not delete either copy and do not restate the rule in both places. Item A is
   the only place this applies; if the sweep finds more, treat them the same way.

4. **Split new rules by kind, exactly as prompt 08 did.** `architecture-web.md` takes
   structure and dependency direction; `stack-web.md` takes tool and library choices;
   `design.md` takes UI/UX; `architecture-api.md`, `stack-api.md` and `naming.md` take
   the back end. Where a rule needs two halves, write it once and cite it from the
   other file.

5. **Item F crosses into back-end docs, and that is intended** — the web rule already
   depends on a back-end shape nobody wrote down. Write the content-pack rules where
   they belong. **But do not hand-edit `docs/requirements.md`:** it is an append-only
   log written by `msg-pre-roadmap` and read by a gate-check, so state what belongs in
   it and let the user decide when to run that skill.

6. **Item D is a genuine gap, not a repair — treat it as one.** Decide how a design
   token reaches a Pixi text style, whether a string rendered inside the canvas is
   translated at all, and which font the arena uses. Then write the rules that hold
   it, in the right files: the token path and font choice are `design.md` and
   `stack-web.md`; who is allowed to reach into `renderer/` is `architecture-web.md`.

7. **Do not invent rules for code that does not exist.** Every rule must trace back to
   something real in `alpha.md`, `docs/design.md`, `docs/requirements.md` or an
   existing rule doc. There is still no web application code and no scaffold.

8. **Name what each decision costs.** A why line that only lists benefits is
   advertising. Where a choice has a real price — a second font loaded for the canvas,
   a Portuguese length budget that constrains every fixed-width column, a locale map
   that makes every content payload larger — name it in the same breath as the rule.

9. **Ask before you assume.** Several items below fix a problem without fixing its
   answer. Use `AskUserQuestion`, or invoke `msg-grill-me` for a fuller interview,
   rather than silently inventing one. One question at a time. At minimum these are
   open: which file owns the renderer boundary (A); whether text inside the canvas is
   translated (D); the Portuguese length budget as an actual number or rule, and
   where the language switcher goes (E); and whether the locale map is a required
   field per name or an optional overlay over a default language (F).

10. **Match the house style.** One imperative, one line of why, numbered, append-only.
    Plain words. Where a real term of art is the right name — port, adapter, loader,
    atlas — use it once and define it in four words.

11. **Executed prompt files under `docs/prompts/` are historical records — leave them
    alone**, except for this file's own `Status` line.

12. **Run `make roadmap-check` and leave it passing**, and confirm `project.yml` still
    points every area at a file that exists.

## Tone

The voice these docs already use: plain words, short sentences, one idea each. No
hedging, no both-sidesing. Assume the reader knows TypeScript and React well, and
knows this game's mechanics not at all — so name a screen ("the gambit editor")
rather than assuming its shape is obvious.

## Output

Edits in place, no new planning docs:

- **`docs/stack-web.md`** — items B (as a citation), C and D's tool half.
- **`docs/architecture-web.md`** — items A and D's structural half.
- **`docs/stack-api.md`** — item B, rule 32 revised in place.
- **`docs/design.md`** — items D and E.
- **`docs/architecture-api.md`, `docs/stack-api.md`, `docs/naming.md`** — item F.

Finish with two short sections in the chat, not in the docs:

1. **What was decided** — the open questions constraints 6 and 9 name, and how each
   was closed, so they are recoverable without re-reading the diff.
2. **Findings** — anything this pass turned up that the prompt did not ask about,
   including what belongs in `docs/requirements.md` per constraint 5. Report them;
   do not act on them.
