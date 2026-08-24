# Goal: Audit `alpha.md` for gaps, settle every open question with me, then seed `docs/requirements.md` with the alpha's full feature list

**Status:** not executed — `docs/requirements.md` still holds only its header row
**Rating:** —
**Run:** before the first `msg-pre-roadmap` run — that skill needs the feature list this prompt seeds

## Context

`alpha.md` is the closed-alpha spec for a browser idle RPG in the Tibia visual
idiom — the player never issues a combat command, they author how the character
fights through two ordered rule lists, then tune while watching. The spec is
detailed on *decisions* (four foundational ones, plus attributes, skills,
hunts, items, death) but it has never been turned into a list of things to
build. Its own `## Still open` section admits this: "Naming this one alpha is
fine; slicing it into a build order is a real exercise and has not been done."

The next step in the planning workflow is `msg-pre-roadmap`, which is run once
per feature and writes User Needs and Functional Requirements into
`docs/requirements.md`. That skill needs a feature to point at. Right now no
such list exists, and `docs/requirements.md` is an empty table.

So this prompt does three things, in order:

1. **Audit.** Read `alpha.md` end to end and find everything undecided,
   contradictory, or silently assumed — including the items already named in
   its `## Still open` section, which are in scope, not "already captured".
2. **Interview.** Walk the open questions with me one at a time and get a
   decision on each, so the feature list is written against a spec with no
   holes.
3. **Seed.** Write one row per feature into `docs/requirements.md`, Module and
   Feature filled in, the remaining columns marked `TODO`, so the table doubles
   as the checklist of which features still need a `msg-pre-roadmap` run.

I have never developed a game before. I am a strong backend engineer, so
backend concepts need no explaining, but every game-development term is new to
me and must be defined the first time it appears.

## Constraints

1. **Read the whole spec first.** `alpha.md` plus everything it links:
   `docs/architecture-api.md`, `docs/architecture-web.md`,
   `docs/explorations/01-how-baiak-idle-works.md`,
   `docs/explorations/02-domain-model.md`,
   `docs/explorations/04-the-live-hunt.md`, and `vision.md`. Do not start
   listing features until the read is done — several open questions only show
   up as a contradiction between two documents.

2. **Modules are game systems, not architecture layers.** Use these nine:

   | Module | Covers |
   | --- | --- |
   | Account | Sign-up, login, character creation, session |
   | Simulation | Arena grid, ticks, movement, targeting shapes, determinism |
   | Authoring | The two rule lists, condition vocabulary, mid-fight editing |
   | Character | Attributes, modifier stacking, skills and skill levels, forms |
   | Progression | XP banking, levels to 30, skill points, death penalty |
   | Hunts | Hunt definitions, tiers, density, waves, boss, daily cap, party scaling |
   | Items | Loot resolution, rarity, affixes, slots, potions, inventory |
   | Offline | Sealing, replay-once, catch-up cap, login summary |
   | Client | Renderer, event stream consumption, buffering, screens |

   Do **not** use Back-end / Front-end / Auth as module names. Those are
   *areas*, already defined in `project.yml`, and a roadmap item records them
   in its own Key Areas section. Recording the layer here too would split one
   feature across three rows and duplicate information the planning workflow
   already tracks.

3. **Feature size is fixed by three tests, not by time estimates.** A feature
   is one sentence a player would recognise, that could be switched off leaving
   a working game.

   - **Player-sentence test.** "My character turns into a bear and gains
     resistances" is a feature. "The modifier list stores sources rather than a
     summed number" is not — that is *how*, not *what*.
   - **Removal test.** Delete it: does the rest still run? If deleting it
     breaks six other things it is foundation, not a feature, and it belongs
     inside the feature that first needs it.
   - **Demo test.** Could it be shown to a friend in 30 seconds, with the
     difference visible?

   Expect roughly 18–24 features. If the count lands far outside that, say so
   and explain which module caused it rather than forcing the number.

4. **Cross-cutting plumbing is not a feature.** Seeded randomness, tile
   reservation order, the event stream version field, the modifier-source
   schema, the fixed tick rate — these become Functional Requirements on the
   feature that needs them, recorded later by `msg-pre-roadmap`. Never give
   them their own row. Where one is load-bearing for a feature, note it in that
   feature's plain-English description so it is not forgotten.

5. **Interview me on the open questions before writing any rows.** One question
   at a time, using the same style as the `msg-grill-me` skill: three or four
   concrete options, one marked recommended, and always an explicit "let me
   type my own" option — do not rely on the tool's built-in free-text entry
   being visible. Order the questions so the ones that block the feature list
   come first; if a question turns out not to block anything, say so and defer
   it rather than spending a question on it.

6. **Show the open-question list before starting the interview.** One ranked
   table: the question, where it came from (`alpha.md` section or a
   contradiction between two docs), and whether it blocks the feature list or
   can wait. This lets me see the size of the hole before answering anything.

7. **Every open question gets a recommended answer with reasoning.** I have no
   game-development instinct to fall back on, so a bare question is not
   answerable. Say what you would pick and why, and what it would cost to
   change later.

8. **Write decisions back into `alpha.md`.** When a question is settled, edit
   the relevant `alpha.md` section and remove the item from its `## Still open`
   list. The spec must end this exercise self-consistent — a decision that
   lives only in the chat transcript is lost.

9. **`docs/requirements.md` is append-only.** Add rows; never edit or delete an
   existing one. Fill Module and Feature. Put `TODO` in User Need Code, User
   Need Details, Functional Requirement Code and Functional Requirement
   Details. Use today's date in Addition Date. Preserve the existing header and
   the note above it verbatim.

10. **Add a plain-English feature description.** The table's own columns have
    nowhere for one, so put a short section above the table — a list of every
    feature with one sentence saying what a player experiences. Two sentences
    maximum per feature.

11. **Order the features by build dependency.** Within the list, put a feature
    after anything it needs to exist first. This is not a roadmap — do not
    write dates, estimates, or a sprint plan — but the ordering should make the
    natural starting point obvious.

12. **Flag anything in `alpha.md` that has no feature and no home.** If a spec
    paragraph produced no feature row, either it is plumbing (say which feature
    absorbed it) or it is scope that was never really decided (say so). Nothing
    in the spec should silently vanish.

13. **Do not add scope.** If something feels missing from the alpha, name it as
    an open question or a `vision.md` candidate. Do not quietly invent a
    feature the spec does not ask for.

14. **Run `make roadmap-check` at the end** and report the result.

## Tone

Direct and clear, explaining like a teacher addressing a beginner. Define every
game-development term the first time it is used — "wave", "tick", "aggro",
"gambit", "affix", "proc", "DPS" — in a short parenthetical, and never
abbreviate one. Backend and architecture vocabulary needs no explanation.

Short sentences. Lead with the point. No praise, no recapping what I just said.
When a recommendation is made, state the trade-off in one line rather than
listing every alternative.

## Output

Three deliverables, in this order:

1. **In chat:** the ranked open-question table (constraint 6), then the
   one-at-a-time interview (constraint 5).
2. **Edits to `alpha.md`:** decisions written into the relevant sections, the
   `## Still open` list reduced to only what genuinely stayed open.
3. **Edits to `docs/requirements.md`:** the plain-English feature description
   section above the table, then one seeded row per feature in the existing
   table.

Close with a short chat summary: how many features, how many open questions
were closed, how many remain, and which feature is the obvious place to point
`msg-pre-roadmap` at first.

## Examples

**A feature row, correctly sized:**

| Module | Feature | User Need Code | User Need Details | Functional Requirement Code | Functional Requirement Details | Addition Date |
| ------ | ------- | --------------- | ------------------ | ---------------------------- | -------------------------------- | -------------- |
| Character | Werebear form | TODO | TODO | TODO | TODO | 2026-08-23 |
| Progression | Death penalty | TODO | TODO | TODO | TODO | 2026-08-23 |
| Offline | Sealed offline session | TODO | TODO | TODO | TODO | 2026-08-23 |

**Its plain-English description:**

> **Werebear form** — the character transforms into a bear, trading attack
> speed for extra health, elemental resistance and health regeneration. A five
> second cooldown means shifting is a commitment, not a reflex.

**Not features** — plumbing, absorbed into the feature that needs them:

- Seeded randomness → a Functional Requirement on *Sealed offline session*
- Tile reservation order → a Functional Requirement on *Arena grid and movement*
- Event stream versioning → a Functional Requirement on *Live battle view*

**A question asked the right way** (constraint 7 — recommendation plus cost of
changing it later):

> **The potion cooldown.** `alpha.md` says potions are free and unlimited,
> which its own Functional Requirements table forbids: "every rate mechanic
> needs a stated bottleneck". Options: a flat per-potion cooldown, a shared
> cooldown across all potion tiers, or a charge count that refills per hunt.
> Recommended: shared cooldown — one number to tune, and it stops a rule list
> from spamming potions as its whole strategy. Cheap to change later; it is a
> content value, not a schema change.
