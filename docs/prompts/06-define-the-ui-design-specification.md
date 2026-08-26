# Goal: Define the UI/UX design specification for gomide_idle's meta UI

**Status:** executed 2026-08-26 — `docs/design.md` and `docs/design-tokens.json` written
**Rating:** —
**Run:** standalone — no dependency on other prompts, but read `docs/stack-web.md` and `docs/architecture-web.md` first since several decisions here (the renderer boundary, the gambit reorder pattern, the tooltip requirements) follow their rules directly

## Context

gomide_idle is a browser idle RPG built in the Tibia visual idiom. A player picks a
hunt, their character clears waves and a boss on its own, and the play is entirely in
**authoring how the character fights** — two ordered rule lists (a skill priority list
and a monster targeting list), the gear and skill points that make those rules pay off,
and retuning them while watching the fight happen. The player never issues a combat
command directly.

The audience is staged: friends in a closed alpha first, then MuOnline/Tibia/WYD
nostalgics, then general idle players. The alpha ships with placeholder or lightweight
production art — the constraint that matters is structure and states, not visual
polish.

**The interface is two zones with two different visual languages, and this is the
single most important constraint on the whole spec:**

1. **The arena** — a pixel-art, Tibia-idiom battle view. Orthogonal top-down, 32×32
   tiles, rendered in PixiJS (not the DOM). Real sprites for a Human/Werewolf/Werebear
   shapeshifter and three monster variants. Health bars over entities, floating damage
   numbers split by damage type (physical / fire / electric), `image-rendering:
   pixelated` scoped to this zone only. **This zone is out of scope for this design
   spec** — it is sprite and canvas work, not a component system.
2. **The meta UI** — everything else: character select, hunt selection, the character
   sheet, the gambit (rule-list) and targeting editors, the inventory and equipment
   screens, the login summary. This is a **modern-looking UI, not pixel art** — built
   in React 19 with Tailwind v4 and copied-in primitives (no installed component
   library). **This meta UI is what this design spec is for.**

The full UI is roughly six screens: character select, hunt selection, the live-hunt
HUD (status panel + gambit trace, which sits over the arena but is itself ordinary
DOM/React), the character sheet, inventory/equipment, and account/settings (including
Stop-or-Retry death preference and the offline-sealing screen). There is no SSR and,
for now, no router — a tab value is enough for six screens.

A few UI-relevant mechanics the spec should design around, because they drive concrete
component needs:

- **The gambit editor.** Two ordered rule lists (skills, and monster targeting), each
  row built from a condition (fixed vocabulary: HP below X%, enemy count above X, in
  form Y, buff Z active, mana below X%, etc.) plus an action. Rows reorder via move
  up/down and `Alt+↑/↓` — no drag-and-drop in this first version. Everything here is
  editable while a fight is running and takes effect on the next tick.
- **The gambit trace.** During a live hunt, the rule list is shown live: the row that
  fired this tick is highlighted, and every skipped row is greyed with its skip reason
  (on cooldown / not enough mana / condition false). This is the game's core feedback
  loop — a player retunes by reading this, not by guessing.
- **The character sheet.** Every attribute is shown with *where it came from* (this
  item, that skill, this buff) — never a single pre-summed number. The view is a map
  over modifier sources plus a running total, not a stat block.
- **Item tooltips.** Uncommon items carry a rolled prefix and a rolled suffix on top of
  base defence. Tooltips need collision-aware flipping at the inventory grid's edge,
  must survive the pointer entering them, and need a tap-to-open path since hover
  doesn't exist on touch.
- **Persistent warnings.** A full inventory needs a persistent, impossible-to-miss HUD
  warning (drops are being forfeited silently otherwise) and the same loss must appear,
  loudest, in the post-offline login summary alongside deaths and destroyed gear.
- **The login summary.** A returning player sees what happened while away — time
  elapsed, waves cleared, net experience, items gained — with **everything lost (deaths,
  destroyed gear, forfeited drops) shown first and loudest**, never buried under gains.
- **Recommended-level and tier/density pickers** on hunt selection — advisory numbers
  rendered next to a choice, never a gate or a lock.

## Constraints

1. **Desktop-first for the alpha.** Design and spec the full layout, grid and
   breakpoints for desktop only. Touch-target sizing (minimum 44px) and tap-to-open
   interaction patterns (e.g. for tooltips) should be specified now since some
   interactions already depend on them, but full mobile/tablet layouts and reflow rules
   are out of scope — note them as deferred, don't design them.
2. **Single dark theme.** One committed dark-leaning look for the meta UI. Do not
   produce a light-mode variant or a light/dark token pair — pick and commit to one
   palette.
3. **Deliverable is both a narrative spec and literal tokens.** Produce a written
   design-specification document (prose and tables, organized by the checklist below,
   with the reasoning behind each decision) **and** a literal design-token set (CSS
   custom properties or a JSON token file) for color, type scale, spacing scale, radii,
   and durations/easing — something a developer can paste directly into the codebase.
4. **Accessibility target: WCAG AA.** Contrast ratios, focus visibility, and keyboard
   navigation should meet AA, not AAA. State this explicitly in the deliverable rather
   than leaving it implicit.
5. **Use shadcn/ui as the component reference baseline.** The codebase's own rule is
   "copied-in primitives, not an installed component library" — shadcn/ui's copy-paste
   model fits that directly. Spec each component's structure and interactive states
   (default/hover/active/disabled/focus, plus loading and error where relevant) against
   shadcn/ui's conventions as the starting point, adapted to this game's own color and
   type tokens rather than shadcn's defaults.
6. **The pixel-art arena is explicitly out of scope.** Do not design sprites,
   animation, or the canvas/PixiJS rendering — only the DOM/React meta UI, including the
   HUD panel and gambit trace that overlay the arena.
7. **Cover every item in the checklist below**, adapted to the above scope:
   1. Layout & structure — grid system, desktop breakpoints only, page/section
      hierarchy across the six screens, whitespace and spacing rules.
   2. Typography — font families (headings/body/UI), type scale, weights, line
      heights, letter spacing, fallback fonts and web-font loading strategy.
   3. Color palette — primary/secondary/accent, neutral scale, semantic colors
      (success/warning/error/info — note that error/warning here also covers death,
      loss and forfeiture states, which are frequent and load-bearing in this game),
      background/surface tiers, WCAG AA contrast ratios.
   4. Spacing & sizing — a spacing scale, component padding/margins, border radius
      values, the 44px minimum touch target noted per constraint 1.
   5. Components — buttons, inputs, dropdowns, checkboxes/toggles, cards, modals,
      tooltips (with the collision-aware, tap-to-open behavior above), toasts/persistent
      warnings, navigation/tabs, tables/lists, pagination, all with full interactive
      states — plus the game-specific components: the gambit row editor (with its fired
      / skipped-with-reason visual states), the character-sheet modifier breakdown, the
      item tooltip, and the inventory grid.
   6. Iconography & imagery — icon style, size grid, stroke width, aspect ratios for any
      imagery, avatar/portrait treatment for characters.
   7. Motion & interaction — durations and easing, hover/focus/press states,
      transitions between the six screens, loading skeletons vs. spinners.
   8. States & feedback — empty states, validation and error messages, success
      confirmations, loading states, disabled/offline states, and specifically the
      full-inventory warning and login-summary loss-first pattern above.
   9. Accessibility — focus indicators, ARIA/screen-reader considerations, the
      keyboard-only path for reordering gambit rows (move up/down, `Alt+↑/↓`, no
      drag-and-drop), reduced-motion alternatives, color-blind-safe treatment for the
      physical/fire/electric damage-type distinction specifically (color alone must not
      carry that distinction).
   10. Responsive behavior — desktop-only per constraint 1; state explicitly what is
       deferred for mobile/tablet rather than designing it.
   11. Content guidelines — tone of voice for microcopy, button label conventions,
       error-message writing rules, and specifically the tone for loss-reporting copy
       (deaths, destroyed gear, forfeited drops) versus gain-reporting copy.
   12. Platform constraints — browser support targets, confirm single dark theme (no
       light variant), and the design-token format from constraint 3.
8. **Ask before you assume.** If anything in this brief is ambiguous, underspecified,
   or leaves a real design decision open (an exact color, a specific font pairing, a
   numeric value the brief didn't give you, etc.), use `AskUserQuestion` (or invoke the
   `msg-grill-me` skill for a fuller interview) rather than silently inventing an answer
   to a question that's actually open. Ask one question at a time.

## Output

Write the narrative design-specification document directly into `docs/design.md`
(Markdown, organized by the twelve checklist sections above) — it's the Design area's
rule doc per `project.yml` and is currently just a placeholder. Write the accompanying
design-token set (color, type scale, spacing scale, radii, motion durations/easing) to
a new `docs/design-tokens.json` — there's no app scaffold yet to consume it, so this is
a staging file to move into the codebase once the front-end exists.
