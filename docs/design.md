# Design rules

UI/UX guidelines for the game's interface. `project.yml` points every
`**Design**` bullet in a roadmap item at this file.

This spec covers the **meta UI** only: character select, hunt selection, the
live-hunt HUD (the status panel and gambit trace that overlay the arena),
the character sheet, inventory/equipment, and account/settings. It is a
modern, dark-themed React 19 + Tailwind v4 interface built from copied-in
primitives, using [shadcn/ui](https://ui.shadcn.com) as the structural
baseline for each component's states. The pixel-art arena — sprites,
animation, the PixiJS canvas — is a different visual language and is out of
scope here; see `docs/stack-web.md` rules 24–28 for the boundary between the
two.

Every literal value below (color, type scale, spacing, radius, motion) is
also published as a token file: [`docs/design-tokens.json`](design-tokens.json).
That file is the thing a developer pastes into the codebase; this file is the
reasoning behind each value in it. If the two ever disagree, the JSON file is
correct and this doc is stale — fix the doc.

Decided 2026-08-26, after walking the open questions in
`docs/prompts/06-define-the-ui-design-specification.md` with Lucas.

## 1. Layout & structure

**Grid.** A 12-column grid inside a centered container, max width `1440px`,
with `32px` page margins and `24px` gutters. Desktop only — see §10.

**App shell.** A persistent top bar, `56px` tall, holds the wordmark (left),
then primary navigation, then the account area (right: an online indicator —
the socket connecting is what "online" means in this game, per
`docs/stack-api.md`'s presence model — and the account menu).

What sits in the navigation slot changes with where the player is:

| Screen | Top bar contents |
| --- | --- |
| Account / login | Wordmark + nothing else — there's no character yet. |
| Character select | Wordmark + account menu only. No character-scoped tabs, because no character is active yet. |
| Hunt selection, Character sheet, Inventory | Wordmark + tabs (Hunt · Character · Inventory) + account menu. Tabs are a plain state value, not routes — `docs/stack-web.md` rule 3 says a router is added only once a screen needs a shareable URL, and none of these six do yet. |
| Live-hunt (arena + HUD) | Wordmark + a compact icon rail replacing the text tabs (Character sheet and Inventory open as slide-over panels without leaving the fight) + account menu. The arena is the point of this screen, so the chrome shrinks to make room for it. |

**Live-hunt layout.** The arena canvas takes the majority of the viewport
width. A fixed `380px` column sits to its right, holding the status panel
(HP/mana/buffs) stacked above the gambit trace (a scrollable rule list). This
column is ordinary DOM/React, not part of the PixiJS canvas — see
`docs/architecture-web.md`'s renderer-boundary rule (the two must never share
a DOM subtree).

**Whitespace rhythm.** Vertical spacing between major page sections is
`32px` (`space-6`). Between related items inside one block, `16px`
(`space-4`). Inside a tight cluster — a label and its value, an icon and its
text — `8px` (`space-2`). Section 4 has the full scale.

## 2. Typography

**Pairing:** [Rajdhani](https://fonts.google.com/specimen/Rajdhani) for
headings and short display text (screen titles, hunt names, section
eyebrows), [Inter](https://fonts.google.com/specimen/Inter) for everything
else — body copy, buttons, labels, stat readouts, tooltips. Rajdhani gives
titles like "Ashfen Ruins" or "Character Select" a bit of the "game client"
character the plain-Steam-style option lacked, without turning the whole UI
into a themed display face — dense text (character sheet rows, gambit
conditions, tooltips) stays in the more legible, more neutral Inter.

**Loading strategy:** both are Google Fonts, loaded via a single
`<link>` to `fonts.googleapis.com` with `display=swap` so text renders in the
fallback immediately and swaps in once the web font loads — no invisible-text
flash. Fallback stacks (also what renders before the swap, and if the font
host is unreachable):

- Display: `'Rajdhani', 'Segoe UI', sans-serif`
- Body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Type scale** (1.25 ratio off a `16px` body — token names on the left):

| Token | Size | Typical use |
| --- | --- | --- |
| `xs` | 12px | Timestamps, fine print, badge text |
| `sm` | 14px | Secondary body text, table cells, tooltip body |
| `base` | 16px | Body copy, form inputs, default UI text |
| `lg` | 18px | Emphasized body, card titles |
| `xl` | 20px | Section headings |
| `2xl` | 24px | Screen sub-headings |
| `3xl` | 30px | Screen titles (e.g. "Hunt Selection") |
| `4xl` | 36px | Hunt/character hero titles |
| `5xl` | 48px | Reserved — large numeric moments only (e.g. a big level-up callout), not routine headings |

**Weights.** Rajdhani: 500 for sub-headings, 600 for standard headings, 700
for hero-scale titles only. Inter: 400 body, 500 UI labels and buttons, 600
for emphasis and stat readouts (e.g. `HP 1,204 / 1,500`), 700 rarely (a single
strong callout per screen, at most).

**Line height and letter spacing.** Headings use `1.15` (tight — short lines
don't need breathing room) with `text-wrap: balance` where supported. Body
copy uses `1.5`. Dense UI text (table rows, list items) uses `1.4`. Uppercase
labels (section eyebrows, tab-like badges) get `0.08em` letter spacing so the
caps don't look cramped; everything else is `0em`.

## 3. Color palette

**One committed dark theme.** No light-mode variant, no light/dark token
pair — every color below is the only value for that role. See §12.

**Mood:** a clean modern game launcher — think Steam or Path of Exile's UI,
not an ornate old-MMO client frame. Flat dark panels, sharp typography,
restrained ornamentation. This was an explicit choice over an "old-school MMO
client chrome" direction: the arena already carries the Tibia idiom (per
`docs/stack-web.md` rule 24), so the meta UI's job is to be a clean,
modern surface around it, not a second pixel-art layer competing for the same
nostalgia.

### Neutrals

Chosen with a slight cool-purple hue bias rather than pure gray, so the
palette reads as chosen rather than a default dark-mode gray scale — the bias
is subtle enough that it never looks tinted, but it ties the neutrals to the
accent below.

| Token | Hex | Role |
| --- | --- | --- |
| `bg` | `#0B0A10` | App background |
| `surface` | `#15131C` | Cards, panels, the default raised surface |
| `surfaceElevated` | `#1E1B28` | Modals, dropdowns, popovers — one step above `surface` |
| `surfaceHover` | `#1C1926` | Hover state for interactive rows/list items |
| `borderSubtle` | `#2A2735` | Decorative dividers, card edges — not required to carry meaning on its own |
| `borderStrong` | `#6E6484` | Input borders, focus-adjacent edges — anything where the border *is* how a control's boundary is identified |
| `textPrimary` | `#E8E6EF` | Default text |
| `textSecondary` | `#9691A8` | Captions, muted labels, secondary body text |
| `textDisabled` | `#5F5A70` | Disabled control text — see the AA note below |
| `overlay` | `rgba(11,10,16,0.72)` | Modal/scrim backdrop |

`borderSubtle` exists purely as a decorative line between surfaces of nearly
identical luminance; it is not the only way any surface is identified (a
card's shadow and padding also do that job), so it isn't held to the 3:1
non-text contrast ratio. `borderStrong` is, because an input's border *is*
the thing telling you where the input is — see the contrast table below.

### Accent

| Token | Hex | Role |
| --- | --- | --- |
| `accent.default` | `#A855F7` | Primary buttons, active tab indicator, links, focus rings, selected states |
| `accent.hover` | `#B968FA` | Hover state for accent-filled elements |
| `accent.active` | `#9333EA` | Pressed state |
| `accent.muted` | `rgba(168,85,247,0.12)` | Subtle backgrounds — selected row, active tab underline background |
| `accent.onAccent` | `#0B0A10` | Text/icon color on top of an accent-filled background |

Electric violet, chosen over an amber/gold accent (reads as "treasure",
already reserved for gain/reward moments — see §11) and over crimson red
(collides with the danger/loss color below). It's bright enough to stay
legible as small UI text on the dark neutrals (see contrast table), which a
darker "moody" purple wasn't.

### Semantic colors

| Token | Hex | Background tint | Role |
| --- | --- | --- | --- |
| `success` | `#22C55E` | `rgba(34,197,94,0.12)` | Confirmations, positive deltas |
| `warning` | `#F59E0B` | `rgba(245,158,11,0.12)` | Non-blocking caution, the full-inventory warning (§8) |
| `danger` | `#EF4444` | `rgba(239,68,68,0.14)` | Errors **and** loss/death/destruction — see below |
| `info` | `#38BDF8` | `rgba(56,189,248,0.12)` | Neutral informational messages |

**Loss and death share the `danger` red, not a separate color.** Deaths,
destroyed gear, and forfeited drops are frequent and load-bearing (the login
summary, the full-inventory warning), but they use the same red a failed
save or a rejected form uses — severity is carried by icon and copy, not a
second red token. A death gets a skull icon, destroyed gear gets a
broken-item icon, a generic error gets an X — that reads as more severe than
just a color, and it keeps the token set to one danger color instead of two
reds a developer has to remember to pick correctly between. This was a
direct choice, made after considering (and rejecting) a dedicated darker
"loss" red.

### Damage types (physical / fire / electric)

Color alone cannot carry this distinction — see §9. Each damage type is a
color **and** a shape, always paired:

| Token | Hex | Icon (Lucide) |
| --- | --- | --- |
| `damageType.physical` | `#9CA3AF` | `swords` |
| `damageType.fire` | `#F97316` | `flame` |
| `damageType.electric` | `#22D3EE` | `zap` |

Gray, orange and cyan were chosen specifically to avoid the red/green
confusion that the most common forms of color blindness produce — none of
the three sits on that axis.

### Contrast (WCAG AA)

Computed against the actual background each pair renders on (AA requires
4.5:1 for normal text, 3:1 for large text ≥24px/19px-bold and for
non-text/UI-component boundaries):

| Pair | Ratio | Result |
| --- | --- | --- |
| `textPrimary` on `bg` | 15.96:1 | Pass (text) |
| `textPrimary` on `surface` | 14.89:1 | Pass (text) |
| `textSecondary` on `bg` | 6.49:1 | Pass (text) |
| `textSecondary` on `surface` | 6.05:1 | Pass (text) |
| `textDisabled` on `bg` | 2.99:1 | Below AA — see note |
| `accent.default` on `bg` | 4.98:1 | Pass (text) |
| `accent.default` on `surface` | 4.65:1 | Pass (text) |
| `accent.onAccent` on `accent.default` (button label) | 4.98:1 | Pass (text) |
| `success` on `bg` | 8.65:1 | Pass (text) |
| `warning` on `bg` | 9.18:1 | Pass (text) |
| `danger` on `bg` | 5.24:1 | Pass (text) |
| `info` on `bg` | 9.20:1 | Pass (text) |
| `damageType.physical` on `bg` | 7.77:1 | Pass (text) |
| `damageType.fire` on `bg` | 7.03:1 | Pass (text) |
| `damageType.electric` on `bg` | 10.91:1 | Pass (text) |
| `borderStrong` on `bg` | 3.59:1 | Pass (non-text, 3:1) |

`textDisabled` intentionally does not meet 4.5:1 — WCAG's contrast success
criterion explicitly exempts inactive/disabled UI components, since there is
nothing to read or operate. Every other text/icon color that appears as
active content meets AA at the size it's used.

## 4. Spacing & sizing

**Scale** (base unit `4px`):

| Token | Value |
| --- | --- |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 24px |
| `space-6` | 32px |
| `space-7` | 48px |
| `space-8` | 64px |

**Component padding.** Buttons and inputs: `space-3` vertical, `space-4`
horizontal (default size) or `space-5` horizontal (large/primary CTA). Cards
and panels: `space-5` all around. Modals: `space-6`. List/table rows:
`space-3` vertical, `space-4` horizontal.

**Radius.**

| Token | Value | Use |
| --- | --- | --- |
| `radius.sm` | 6px | Buttons, inputs, checkboxes, badges |
| `radius.md` | 12px | Cards, panels, modals, dropdown menus |
| `radius.full` | 9999px | Avatars, pills, toggle tracks |

**Touch targets (44px minimum).** Every interactive control's *hit area*
must be at least `44×44px`, even though the alpha is desktop-only — this is
specified now because some interactions (tap-to-open tooltips, §5) already
depend on it, and retrofitting hit areas later touches every component.
Where the *visible* control is smaller than 44px by design — the gambit row's
move-up/move-down icon buttons, an inventory slot's corner action — pad the
hit area out to 44px with invisible padding or a transparent pseudo-element
rather than growing the visible box. Standalone primary buttons render at a
true `44px` height; nothing needs the padding trick there.

## 5. Components

Structure and states follow shadcn/ui's conventions, restyled with the
tokens above. Every interactive component below is specified for
`default / hover / active / focus / disabled`, plus `loading` and `error`
where applicable.

### Buttons

| Variant | Default | Hover | Active | Focus | Disabled |
| --- | --- | --- | --- | --- | --- |
| Primary | `accent.default` fill, `accent.onAccent` text | `accent.hover` fill | `accent.active` fill | 2px `accent.default` ring, 2px offset | 40% opacity, no pointer events |
| Secondary | `surface` fill, `borderStrong` border, `textPrimary` text | `surfaceHover` fill | slightly darker fill | same ring | 40% opacity |
| Destructive | `danger` fill, white text | darker `danger` | darker still | `danger`-colored ring | 40% opacity |
| Ghost/text | transparent, `textPrimary` text | `surfaceHover` fill | `surfaceHover` fill, darker | same ring | `textDisabled` text |

A `loading` state replaces the label with a spinner (§7) at the same size —
the button never resizes — and disables pointer events without switching to
the visually-disabled style, so it doesn't read as unavailable, just busy.

### Inputs (text, number, select)

Default: `surface` fill, `borderStrong` border, `textPrimary` text,
`textSecondary` placeholder. Focus: border becomes `accent.default`, plus the
standard focus ring. Disabled: `textDisabled` text, `borderSubtle` border, no
fill change. Error: border and helper text switch to `danger`, an error icon
appears trailing the field, and the helper text explains what to fix (§11).

### Checkboxes / toggles

Checkbox: `borderStrong` box on `surface`; checked state fills `accent.default`
with a white check icon. Toggle (switch): `surfaceHover` track when off,
`accent.default` track when on, white thumb. Both get the standard focus
ring and a 44px hit area regardless of their smaller visible size.

### Cards

`surface` fill, `borderSubtle` 1px border, `radius.md`, `space-5` padding.
Interactive cards (e.g. a hunt option) add a hover state (`surfaceHover`
fill, border brightens to `borderStrong`) and a selected state (`accent`
border + `accent.muted` fill).

### Modals

`surfaceElevated` fill, `radius.md`, centered, backdrop is `overlay`. Opens
and closes with the `base` motion duration (§7). Focus moves to the modal on
open and is trapped inside it; `Escape` closes it and returns focus to the
trigger.

### Tooltips

Built on a positioning engine (not a bare CSS `:hover` tooltip), per
`docs/stack-web.md` rule 27 — item tooltips carry a rolled prefix and suffix
on top of base defence, and need to:

- **Flip** to stay on-screen when triggered near the inventory grid's edge
  (collision-aware positioning, not a fixed side).
- **Survive the pointer entering them** — moving the mouse from the trigger
  into the tooltip itself must not close it, since a tooltip can contain a
  scrollable modifier breakdown.
- **Open on tap**, not just hover, since hover doesn't exist on touch (§10)
  — a tap opens it, a second tap elsewhere closes it.

Visually: `surfaceElevated` fill, `borderSubtle` border, `radius.sm`,
`space-3` padding, `sm` type.

### Toasts and persistent warnings

Toasts (transient confirmations, e.g. "Gambit saved") slide in from a fixed
corner, auto-dismiss after ~4s, and use the semantic colors for their left
edge accent. The **full-inventory warning is not a toast** — it's a
persistent banner pinned to the HUD (not auto-dismissing, not stackable with
other toasts) using `danger` styling, because drops are being silently
forfeited while it's up and it must stay impossible to miss until the player
clears space. See §8.

### Navigation / tabs

Text tabs (Hunt · Character · Inventory) sit in the top bar. Active tab:
`accent.default` text, `accent.default` 2px underline. Inactive: `textSecondary`,
underline transparent. Hover: `textPrimary`. The live-hunt icon rail uses the
same active/inactive/hover logic with icons instead of labels, each with a
44px hit area.

### Tables / lists

Row default: `bg` (or `surface` inside a card), `borderSubtle` bottom
divider. Hover: `surfaceHover`. Selected: `accent.muted` fill. Header row:
`textSecondary`, `xs` uppercase with `uppercaseLabel` letter-spacing.

### Pagination

Only the inventory grid and any future item lists are long enough to need
it. Standard prev/next + page-number buttons, styled as ghost buttons (see
above), current page shown as the selected/active state.

### The gambit row editor

One row per rule, each built from a condition (a fixed vocabulary — HP below
X%, enemy count above X, in form Y, buff Z active, mana below X%, etc.) and
an action. Rows reorder via visible move-up/move-down icon buttons (44px hit
area, per §4) plus the `Alt+↑/↓` keyboard shortcut — there's no drag-and-drop
in this version, per `docs/stack-web.md` rule 29.

During a live hunt the row list becomes a **trace**, showing what the rule
list actually did on the last tick:

| State | Treatment |
| --- | --- |
| Fired this tick | `accent.muted` background, `accent.default` left border, brief `fast`-duration flash on the tick it fires |
| Skipped — on cooldown | `surface` background, `textSecondary` text, greyed condition icon, trailing label "On cooldown" |
| Skipped — not enough mana | same greyed treatment, trailing label "Not enough mana" |
| Skipped — condition false | same greyed treatment, trailing label naming the failed condition, e.g. "HP not below 30%" |
| Editing (live) | a normal editable row keeps its edit affordances even while the trace is running — edits apply on the next tick, so the row shows both its editable controls and its last-tick trace state at once |

This is the game's core feedback loop (a player retunes by reading this, not
by guessing), so the skip reason is always visible as text, never only as a
tooltip — nothing here should require a hover to understand.

### Character sheet modifier breakdown

Built by hand from the source list the server sends (`docs/stack-web.md`
rule 28), never a pre-summed number. Each attribute row expands to show every
contributing source (an item, a skill, a buff) with its individual value,
then a running total row styled with `textPrimary` and `bodySemibold`
weight, visually distinct from the source rows above it (`textSecondary`,
`bodyRegular`).

### Item tooltip

See "Tooltips" above for the positioning behavior. Content structure: item
name (`display`, colored by rarity — uncommon items get a distinct
`accent`-family color for their name, common items use `textPrimary`), base
stats, then the rolled prefix and suffix each on their own line with a subtle
visual separator, so a player can tell "base defence" apart from "what this
roll added" at a glance.

### Inventory grid

A uniform grid of square slots (`surface` fill, `borderSubtle` border,
`radius.sm`), each holding an item icon at 1:1 aspect ratio (§6). Empty
slots render the same border with no fill. A full grid (see §8) adds the
persistent warning; individual slots never show their own "full" state since
the constraint is the grid, not the slot.

## 6. Iconography & imagery

**Icon set:** [Lucide](https://lucide.dev) — it's shadcn/ui's own default,
so there's no second icon library to integrate, and it already has the
specific glyphs this game needs: `skull` (death), `package-x` (destroyed
gear), `swords` / `flame` / `zap` (damage types), `alert-triangle` (warning),
`x-circle` (error), `info` (info).

**Size grid:** 16px (inline with text, `sm`/`base` type), 20px (buttons,
form fields), 24px (standalone/nav icons). Stroke width: `1.75px` — a touch
finer than Lucide's `2px` default, matched to the "clean modern launcher"
mood rather than a heavier game-UI look.

**Imagery aspect ratios:** item icons `1:1`. Character portraits (character
select, account menu) `3:4` (portrait), matching a typical RPG character-card
shape. Both render at `image-rendering: auto` — the pixelated rendering rule
is scoped only to the arena's own sprites (`docs/stack-web.md` rule 26), not
to portraits or item icons in the meta UI, even where the source art is
pixel art.

## 7. Motion & interaction

**Feel:** snappy and minimal — the UI gets out of the way fast so attention
stays on the arena and the gambit trace, which is where the actual game is.
No bounce or overshoot.

| Token | Duration | Use |
| --- | --- | --- |
| `instant` | 100ms | Micro state changes — checkbox check, toggle flip |
| `fast` | 150ms | Hover/press feedback, tooltip open |
| `base` | 200ms | Dropdown/menu open, tab switch |
| `slow` | 300ms | Modal open/close, screen-level transitions |

Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-out) for all of the
above — nothing in this UI uses a spring or overshoot curve.

**Hover/focus/press.** Hover changes fill/border only (no movement). Focus
adds the standard ring (§9) and never removes the hover treatment
underneath it. Press (`active`) darkens the fill one step further than
hover, applied instantly (no transition on press-down, `fast` transition on
release).

**Screen transitions.** Since navigation is a state value, not a route,
switching screens is a `base`-duration cross-fade — no slide, no shared-element
animation. The live-hunt view (entering/leaving a hunt) gets the `slow`
duration since it's a bigger visual change (the arena mounting/unmounting).

**Loading skeletons vs. spinners.** Skeletons (pulsing `surfaceHover`
blocks in the shape of the content) are used where the content's shape is
known in advance and stable — the inventory grid, the character sheet's
modifier rows. Spinners are used for indeterminate actions with no
predictable shape — form submission, "Start Hunt" while the request is in
flight.

## 8. States & feedback

**Empty states.** A short `textSecondary` line plus, where an action would
resolve it, a single button — e.g. an empty inventory shows "No items yet"
with no button (nothing to do about it); an empty gambit list shows "No
rules yet" with an "Add rule" button.

**Validation and error messages.** Inline, next to the field that caused
them, in `danger` — never a summary block disconnected from the fields. Copy
follows §11's rule: state what's wrong and how to fix it, no apology.

**Success confirmations.** A toast (§5) for transient actions (gambit saved,
settings updated). No modal "Success!" dialogs — they add a click for no
new information.

**Loading states.** See §7 for skeleton vs. spinner. A screen never shows
both at once.

**Disabled / offline states.** A disabled control uses the disabled
treatment from its component spec in §5 (never just lowered opacity applied
generically). If the socket connection drops (§1 — the socket is what
"online" means), the app shows a persistent, non-blocking `warning`-styled
banner ("Reconnecting…") rather than disabling the whole UI; actions that
require the live connection (starting a hunt, editing a gambit while one
runs) are individually disabled with a tooltip explaining why.

**Full-inventory warning.** A persistent `danger`-styled banner pinned to
the HUD, not a dismissible toast — while it's up, drops are being silently
forfeited, so it must stay visible until the player actually clears space,
not until they acknowledge it.

**Login summary — loss before gains.** A returning player's summary always
orders **deaths, destroyed gear, and forfeited drops first**, in `danger`
styling with the skull/broken-item icons from §3, followed by gains (XP,
items, waves cleared) below in `success`/neutral styling. This ordering is
fixed, not merely "loss is styled worse" — it's a hard section order, so a
big loss can never end up scrolled below a wall of minor gains.

## 9. Accessibility

**Target:** WCAG AA — contrast ratios, focus visibility, and keyboard
navigation. Not AAA.

**Focus indicators.** A 2px `accent.default` ring with a 2px offset from the
element, on every focusable element, with no exceptions for "it looks
cleaner without it" — focus-visible only (not shown on mouse click, shown on
keyboard focus).

**ARIA / screen reader.** Standard shadcn/ui-pattern semantics: real
`<button>`/`<input>` elements wherever possible rather than styled `<div>`s,
`aria-live="polite"` regions for the gambit trace's fired/skipped updates and
for toasts, `aria-expanded`/`aria-controls` on the tooltip trigger, dialog
role and focus trap on modals (§5).

**Keyboard-only gambit reorder.** A gambit row is focusable; `Alt+↑` moves it
up one position, `Alt+↓` moves it down one, and the move-up/move-down icon
buttons are also independently tabbable and activatable with `Enter`/`Space`
— no drag-and-drop, per `docs/stack-web.md` rule 29, so this is the only
reorder path and it must fully work with a keyboard alone.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, every transform-
or position-based transition collapses to ~1ms; opacity-only fades are kept
at the `fast` duration so state changes (a tab switching, a modal appearing)
are still perceivable without motion.

**Damage-type color-blind safety.** Physical/fire/electric is never color
alone — each pairs a distinct color (§3) with a distinct icon shape
(`swords`/`flame`/`zap`), so the distinction survives any form of color
blindness. This applies everywhere the distinction appears: damage numbers,
gambit condition badges, item tooltips.

## 10. Responsive behavior

**Desktop only for the alpha.** This spec's layout, grid, and breakpoints
(§1, §4) target `≥1280px`, functioning down to `1024px` without a dedicated
redesign. Below `1024px` — phone and tablet layouts, reflow rules, a
touch-first navigation pattern — is explicitly **deferred**, not designed
here.

Two things are specified now anyway because later interactions already
depend on them, per the brief's own constraint:

- **44px minimum touch targets** (§4) — retrofitting hit areas after the
  fact touches every component, so they're sized right from the start even
  though desktop mouse input doesn't strictly require it.
- **Tap-to-open tooltips** (§5) — the interaction exists in the spec now so
  the tooltip's state machine (open/close/flip) doesn't have to be redesigned
  later, even though touch input itself is out of scope for the alpha.

## 11. Content guidelines

**Tone:** plain and factual throughout, including loss-reporting copy. A
death or a destroyed item is stated exactly as what happened — "You died to
Ashfen Ruins' boss." / "3 items were destroyed." — with no dramatization and
no apology. The visual weight (§3's danger red, the skull/broken-item icons,
§8's forced ordering) is what signals severity; the copy doesn't need to
editorialize on top of it, and staying plain keeps loss lines consistent in
voice with gain lines ("Gained 4,200 experience.") rather than having the UI
suddenly shift register when something bad happens.

**Button labels.** Verb-first, specific to the action: "Start Hunt", not
"Start" or "Go". "Save Gambit", not "Save" (a screen can have more than one
thing to save). Destructive actions name what's being destroyed: "Delete
Character", not "Delete".

**Error messages.** State what went wrong and what to do about it, in that
order. "Enter a character name." not "Invalid input." "Hunt could not start
— check your connection and try again." not "Something went wrong."

**Loss vs. gain copy.** Loss lines and gain lines use the same plain,
declarative sentence structure ("X happened") — the only difference is which
one comes first (§8) and which semantic color it's styled in (§3). Neither
gets more or less narrative weight in the writing itself.

## 12. Platform constraints

**Browser support:** the current and previous major version of Chrome,
Firefox, Edge, and Safari. No IE11, no legacy Edge.

**Theme:** single dark theme, confirmed — no light-mode variant, no
light/dark token pair. See §3.

**Token format:** literal values are published as JSON —
[`docs/design-tokens.json`](design-tokens.json) — covering color, type
scale, spacing scale, radii, and motion durations/easing, ready to paste into
the codebase once the front-end scaffold exists (there isn't one yet, per
`docs/prompts/06-define-the-ui-design-specification.md`'s Output section).
