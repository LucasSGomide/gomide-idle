# 02 — The web foundation: shell, design system and the first rendered screen — Wireframes

Drawn from each slice's `## User experience` section. Tasks `01`, `02`, `03` and
`05` render nothing and have no frames here.

Every frame is the signed-out `/` route, desktop only (§10), inside §1's centered
container: max width `1440px`, `32px` page margins. The `78`-column boxes below
are the container, not the viewport.

## 04 — The router, the root shell and the top bar

**Screen:** `/` — the shell over an empty body

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|           (body intentionally empty - the Account item fills it)           |
|                                                                            |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
     ^                                                              ^
     wordmark: "Tormented Path" bold, ": ", "Mortal      standalone switcher,
     Ways" italic - one line, Rajdhani, no wrap          Inter 500
     top bar is 56px tall
```

The body is blank by decision, not by omission: §1 specifies the signed-out top
bar and no body for it, because the login form that fills it belongs to the
Account item. There is no empty-state line and no button here — §8's empty state
is for a region whose content failed to arrive, and this region has no content
yet by design.

**Design rules**

- §1 App shell — a persistent top bar `56px` tall, wordmark left. The
  Account/login row is wordmark + a standalone language switcher and nothing
  else: no navigation slot, no account menu, because no account exists yet
- §1 Wordmark — one line: **Tormented Path** bold, then `: `, then _Mortal Ways_
  in italic. Rajdhani (§2), never wraps. Both strings come from the single
  `brand` module and are never translated (`design.md` §1, `naming.md` rule 16)
- §1 Grid — 12 columns in a centered container, max `1440px`, `32px` page
  margins, `24px` gutters
- §2 Pairing — Rajdhani for the wordmark as short display text, Inter for the
  switcher and every other control
- §2 Loading strategy — both faces load with `display=swap` and a declared
  fallback stack, so the bar paints in the fallback rather than flashing invisible
- §10 Responsive — desktop only; no breakpoint work in this slice

**Screen:** `/` — the language switcher open

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN ^ ]  |
+----------------------------------------------------------------------------+
|                                                          +--------------+  |
|                                                          | * English    |  |
|                                                          |   Portugues  |  |
|                                                          +--------------+  |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
                                                            ^
                                          menu is radius.md (12px), space-3
                                          vertical / space-4 horizontal rows
```

Each language is named in its own language, never translated into the current
one — a player who cannot read the current language is exactly the one opening
this control. Choosing writes `localStorage` and nothing else, and re-renders
every string in the bar at once.

**Design rules**

- §13 The language switcher — signed out, §1's login top bar carries a
  standalone switcher, because the account menu that would otherwise hold it does
  not exist yet; the choice writes `localStorage` only and is carried onto the
  account at sign-up
- §4 Touch targets — the trigger's hit area is at least `44x44px`; where the
  visible control is smaller, pad the hit area out invisibly rather than growing
  the visible box
- §4 Component padding and radius — menu rows at `space-3` vertical /
  `space-4` horizontal, `radius.md` (`12px`) on the menu, `radius.sm` (`6px`) on
  the trigger
- §9 Focus indicators — a `2px` `accent.default` ring at `2px` offset on the
  trigger and on every row, focus-visible only
- §9 ARIA — a real `<button>` trigger carrying `aria-expanded` and
  `aria-controls`, not a styled `<div>`
- §13 Length budget +40% — the bar is verified against the real Portuguese
  strings, not against a percentage, now that both catalogues exist
- §13 Nothing truncates — no translated string in this UI takes an ellipsis; a
  longer label wraps or the control grows

## 06 — The error boundary, the error catalogue and the footer

The footer is a **New pattern**. `design.md` describes no footer at all — §1 ends
at the top bar and the live-hunt column — so the three frames below are where its
height, placement and type scale get decided, and the design doc owes a §1 rule
once this ships.

**Proposed, for the rule design.md owes:** the footer is pinned to the bottom of
the shell, `32px` tall (`space-6`), sharing §1's `32px` page margins, its text at
`xs` (`12px`) Inter 400 in `textSecondary`, values separated by `space-4`. It is
persistent — it does not scroll away, and it survives into every later screen.

**Screen:** footer — pending

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|                                                                            |
|                                                                            |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
```

No footer line and no spinner. The shell is the page, exactly as in `04`. This is
the state most likely to be got wrong by adding a spinner "so something happens";
the values arrive after the shell is already up and their absence is not a wait
worth announcing.

**Design rules**

- §8 Loading states — a screen never shows a skeleton and a spinner at once;
  here it shows neither, because the footer is not the reason the player is on
  this page
- §7 Motion — nothing animates into place when the values land

**Screen:** footer — loaded

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
|  protocol 3  |  content-pack 2026.08.1  |  build a9ac2c2                   |
+----------------------------------------------------------------------------+
   ^
   xs (12px) Inter 400, textSecondary, 32px tall, page margins match §1
```

These three values are `UN.10`'s path made visible: fetched by a generated hook
from `01`'s endpoint, which reads Postgres through Drizzle.

**Design rules**

- §2 Type scale — `xs` (`12px`) is the fine-print step; Inter 400, not Rajdhani,
  because this is dense readout text and not display text
- §3 Contrast (WCAG AA) — `textSecondary` at `12px` still clears AA against the
  shell background; this is the frame's real constraint, since `xs` plus a muted
  token is the easiest way to fail it
- §1 Whitespace rhythm — `space-4` (`16px`) between the three related values,
  which sit in one cluster rather than as three page sections
- §13 Nothing truncates — a longer Portuguese label wraps or the footer grows;
  no ellipsis

**Screen:** footer — error

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
|  Version details are unavailable. Reload to try again.                     |
+----------------------------------------------------------------------------+
   ^
   danger token; copy comes from the catalogue entry for the error's code
```

The line is the catalogue entry keyed off the error's `SCREAMING_SNAKE_CASE`
`code`. The server's `message` is never rendered — not here, not in a title
attribute, not in the DOM at all.

**Design rules**

- §8 Validation and error messages — inline and next to what caused them, in
  `danger`, never a summary block; copy states what is wrong and what to do about
  it, with no apology
- §11 Copy — via §8: what went wrong, then what to do, in that order
- §13 One whole sentence — the string is written whole in both catalogues and
  never assembled from fragments at render time, because word order moves in
  translation
- §3 Contrast (WCAG AA) — the `danger` token clears AA at `xs` against the shell
  background

**Screen:** error boundary — a route's subtree threw

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|  +----------------------------------------------------------------------+  |
|  |  This section could not be loaded.                                   |  |
|  |  [ Reload ]                                                          |  |
|  +----------------------------------------------------------------------+  |
|                                                                            |
+----------------------------------------------------------------------------+
|  protocol 3  |  content-pack 2026.08.1  |  build a9ac2c2                   |
+----------------------------------------------------------------------------+
      ^
      the block replaces the throwing region only; the bar and the
      footer are outside it and keep rendering
```

The application-root boundary renders this same block full-width, with the top
bar still drawn — there is no second layout and no second catalogue entry. What
changes is how much of the page the block occupies, never what it says.

The footer keeps rendering because it sits outside every route's boundary: a
throw in the body is not a reason to drop `UN.10`'s three values, and their being
up is often what tells you which build threw.

**Design rules**

- §8 Validation and error messages — inline and next to what caused them, never
  a summary block disconnected from the region; copy states what is wrong and
  what to do about it, with no apology
- §8 Empty states — a short `textSecondary` line plus a single button, because
  here an action does resolve it; the empty-state shape is the model this block
  follows
- §3 Contrast (WCAG AA) — the block sits in `danger`; both the line and the
  button label clear AA against the shell background
- §4 Component padding — the block is a panel at `space-5` all round with
  `radius.md` (`12px`); the button is `space-3` vertical / `space-4` horizontal
  at `radius.sm`
- §9 Focus indicators — the button takes the `2px` `accent.default` ring at `2px`
  offset, and focus moves into the block when it replaces the region
- §13 One whole sentence — both strings are whole entries in both catalogues,
  never assembled at render time

## 07 — The socket client and the out-of-date screen

**Screen:** protocol mismatch — full screen

```
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|                                                                            |
|                        Your client is out of date.                         |
|                                                                            |
|                       Reload the page to continue.                         |
|                                                                            |
|                                 [ Reload ]                                 |
|                                                                            |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
```

This replaces the whole page — the top bar and the footer go with it. It is a
refusal, not a degraded mode: the client will not run against a protocol it does
not speak, so there is nothing left on screen to interact with.

A matching protocol is not a frame: the handshake runs behind the shell and the
screen is untouched, identical to `06`'s loaded state.

**Design rules**

- §8 Disabled / offline states — deliberately **not** the `warning` "Reconnecting…"
  banner. That banner is for a dropped connection where the rest of the UI still
  works; a protocol mismatch is a hard stop, so the screen is replaced rather than
  individual actions disabled
- §11 Copy — via §8: what went wrong, then what to do, no apology
- §13 One whole sentence — both lines are whole strings in both catalogues, never
  glued from fragments; the screen renders in the mirrored language, since the
  player never reached an account
- §2 Type scale — the headline at `2xl` (`24px`) Rajdhani 600 as a screen
  sub-heading; the instruction at `base` (`16px`) Inter 400
- §5 Buttons and §4 — the reload control is a standalone primary button at a true
  `44px` height, `space-3` vertical / `space-5` horizontal padding, `radius.sm`
- §9 Focus indicators — the button takes the `2px` `accent.default` ring at `2px`
  offset; it is the only focusable element on the screen
- §13 Length budget — sized against the real Portuguese strings; the button wraps
  or grows rather than truncating
