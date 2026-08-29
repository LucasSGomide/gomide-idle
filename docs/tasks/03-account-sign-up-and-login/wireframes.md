# 03 — Account sign-up and login: accounts, sessions and the first guarded screen — Wireframes

Drawn from each slice's `## User experience` section. Tasks `01` to `05` are the
API half and render nothing, so they have no frames here.

Every frame is desktop only (§10), inside §1's centered container: max width
`1440px`, `32px` page margins. The `78`-column boxes below are the container, not
the viewport. The wordmark is §1's lockup as `02` built it —
`Tormented Path: Mortal Ways`, the game name bold and the season italic, one line
that never wraps.

## 06 — One origin in development, and the generated auth client

**Screen:** `/` — the unchanged shell, with the footer now reaching real Nest

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|            (body still empty - task 08 fills it with the sign-in form)     |
|                                                                            |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
|  Protocol 1      Content pack 0.3.0      Build a1b2c3d                     |
+----------------------------------------------------------------------------+
                     ^
                     the same three values 02 already renders - but resolved
                     here from a request that reached Nest through Vite's
                     proxy, where before this slice they only ever came from
                     MSW inside a test
```

Nothing about this layout is new. The frame exists to name what the slice
changes, which is the origin the footer's request goes to and not a single pixel
of the shell. `02`'s pending state is kept as built: no line and no spinner while
the request is in flight, because the footer is one row and a spinner in it is
more motion than information.

**Design rules**

- §1 App shell — the top bar stays `56px`, wordmark left, standalone language
  switcher right; the signed-out Account/login row carries no account menu
- §1 Grid — 12 columns in a centered container, max `1440px`, `32px` page
  margins, `24px` gutters
- §8 Loading states — a screen never shows a skeleton and a spinner at once; the
  footer's pending state stays "render nothing"
- §10 Responsive — desktop only, `≥1280px`, functioning down to `1024px`

**Screen:** `/` — the footer's error row, with the API stopped

```
+----------------------------------------------------------------------------+
|  Could not reach the server. Check your connection and try again.          |
+----------------------------------------------------------------------------+
   ^
   the catalogue entry for the error's `code`, in `danger` - never the
   server's own `message`, which the fetch mutator already discards
```

**Design rules**

- §8 Validation and error messages — in `danger`, stating what went wrong
- §11 Error messages — what went wrong, then what to do about it, in that order
- §13 Length budget — the row wraps rather than truncating; no translated string
  in this UI gets an ellipsis

## 07 — `features/session`, the `_authed` guard and the characters shell

**Screen:** `/characters` — the signed-in top bar over an empty body

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                              [ Account v ]    |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|            (body intentionally empty - the character list belongs to       |
|             the Character creation and selection item)                     |
|                                                                            |
|                                                                            |
+----------------------------------------------------------------------------+
|  Protocol 1      Content pack 0.3.0      Build a1b2c3d                     |
+----------------------------------------------------------------------------+
     ^                                                    ^
     wordmark, unchanged                 §1's Character-select row: account
                                         menu only, no character-scoped tabs,
                                         because no character is active yet
```

§1's app shell also describes an online indicator beside the account menu. It is
not drawn here: the socket is what "online" means and it opens when a character
is selected (`FR.3.1`), which is the next roadmap item. The slot stays free for
it rather than being filled with a permanently-offline dot.

**Design rules**

- §1 App shell — the Character-select row is wordmark + account menu only; the
  bar stays `56px` tall
- §1 Grid — the same centered container as every other screen
- §8 Empty states — no empty-state line and no button here: the region has no
  content yet by design, which is not the same as content that failed to arrive
- §10 Responsive — desktop only

**Screen:** `/characters` — the account menu open

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                              [ Account ^ ]    |
+----------------------------------------------------------------------------+
|                                                +--------------------+      |
|                                                |  * English         |      |
|                                                |    Portugues       |      |
|                                                +--------------------+      |
|                                                |    Sign out        |      |
|                                                +--------------------+      |
|                                                                            |
+----------------------------------------------------------------------------+
                                                   ^
                                                   menu is radius.md (12px),
                                                   rows space-3 vertical /
                                                   space-4 horizontal, each
                                                   row's hit area 44px
```

Each language is named in its own language and never translated into the current
one — the same rule `02`'s signed-out switcher already follows. Choosing writes
`localStorage` alone: there is no `player_account` in this item, so the signed-in
control has exactly one write path today and gains its second in **Language and
localisation**. Sign out sits below a divider because it is the only destructive
thing in the menu.

**Design rules**

- §13 The language switcher — signed in it is an item in the account menu,
  because the active language lives on the account
- §13 Length budget +40% — every row holds the real Portuguese string; nothing
  truncates and nothing gets an ellipsis
- §5 Buttons (Ghost/text) — menu rows are ghost controls: transparent by
  default, `surfaceHover` fill on hover
- §7 Hover/focus/press — the menu opens at `base` (200ms); hover changes fill
  only, with no movement
- §9 Focus indicators — a 2px `accent.default` ring at 2px offset, focus-visible
  only, on the trigger and every row
- §9 ARIA — real `<button>` semantics with `aria-expanded` on the trigger
- §4 Touch targets — each row's hit area is at least `44×44px`, padded out
  invisibly rather than by growing the visible row
- §11 Button labels — verb-first and specific: "Sign out"

**Screen:** `_authed` — the session still resolving, and the session failed

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                               |
+----------------------------------------------------------------------------+
|                                                                            |
|                                                                            |
|                                ( spinner )                                 |
|                                                                            |
|         ...or, when the session request fails outright:                    |
|                                                                            |
|          Could not reach the server. Check your connection and             |
|          try again.                                                        |
|                                                                            |
+----------------------------------------------------------------------------+
     ^
     the bar's right slot renders neither control while the session is
     unresolved - painting the signed-out standalone switcher here is
     exactly the flash the States bullet forbids, and painting the account
     menu asserts a session nobody has confirmed yet
```

Both variants are the same layout — the shell with one centered region — so they
share a frame. §7 puts a spinner here rather than a skeleton: until the session
answers, the shape of what follows is not known, which is the whole distinction
that section draws.

**Design rules**

- §7 Loading skeletons vs. spinners — spinners for indeterminate waits with no
  predictable content shape; skeletons only where the shape is known in advance
- §7 Reduced motion — under `prefers-reduced-motion` the spinner's transition
  collapses; an opacity-only fade stays at `fast` so the change is still
  perceivable
- §8 Loading states — never a skeleton and a spinner at once
- §8 Validation and error messages — the failure renders in `danger`
- §11 Error messages — what went wrong, then what to do, from the catalogue
  entry for the `code`
- §9 ARIA — the resolving region is an `aria-live="polite"` region so the
  outcome is announced rather than silently swapped in

## 08 — The sign-in and sign-up screens

**Screen:** `/` — sign-in, the body `02` reserved

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                    +------------------------------------+                  |
|                    |  Sign in                           |                  |
|                    |                                    |                  |
|                    |  E-mail                            |                  |
|                    |  [                              ]  |                  |
|                    |                                    |                  |
|                    |  Password                          |                  |
|                    |  [                              ]  |                  |
|                    |                                    |                  |
|                    |  [           Sign in            ]  |                  |
|                    |                                    |                  |
|                    |  No account yet? Create one        |                  |
|                    +------------------------------------+                  |
|                                                                            |
+----------------------------------------------------------------------------+
|  Protocol 1      Content pack 0.3.0      Build a1b2c3d                     |
+----------------------------------------------------------------------------+
                       ^                              ^
                       card: surface fill,            primary button, true
                       borderSubtle, radius.md,       44px height, space-5
                       space-5 padding                horizontal padding
```

The "Create one" link is the only route to `/sign-up`, and it is **removed**, not
disabled, when registration is closed — a disabled control invites a player to
work out why, and there is nothing they can do about it.

**Design rules**

- §5 Inputs — `surface` fill, `borderStrong` border, `textSecondary` placeholder;
  focus turns the border `accent.default` and adds the standard ring
- §5 Buttons (Primary) — `accent.default` fill with `accent.onAccent` text
- §4 Component padding — inputs and buttons `space-3` vertical / `space-4`
  horizontal, `space-5` horizontal for the primary CTA; the card `space-5` all
  round
- §4 Radius — `radius.sm` (6px) on inputs and buttons, `radius.md` (12px) on the
  card
- §11 Button labels — verb-first and specific: "Sign in", not "Go"
- §9 Focus indicators and ARIA — real `<input>` and `<button>` elements, tab
  order e-mail → password → submit → link, 2px `accent.default` ring at 2px
  offset
- §13 Length budget +40% — every control is sized against the real Portuguese
  string, not the English one
- §1 Grid — the form sits in the body the shell reserved; the top bar and footer
  are `02`'s, unchanged

**Screen:** `/` — submit pending

```
                     +------------------------------------+
                     |  [            ( o )             ]  |
                     +------------------------------------+
                        ^
                        the label is replaced by a spinner at the same size:
                        the button never resizes, and pointer events are off
                        without the visually-disabled treatment, so it reads
                        busy rather than unavailable
```

**Design rules**

- §5 Buttons (loading) — the spinner replaces the label at the same size, the
  button does not resize, and it never switches to the disabled style
- §7 Loading skeletons vs. spinners — form submission is the named case for a
  spinner
- §7 Feel — no bounce or overshoot; `cubic-bezier(0.4, 0, 0.2, 1)` throughout

**Screen:** `/` — a rejected attempt

```
+----------------------------------------------------------------------------+
|                    +------------------------------------+                  |
|                    |  Sign in                           |                  |
|                    |                                    |                  |
|                    |  E-mail                            |                  |
|                    |  [ ada@example.com              ]  |                  |
|                    |                                    |                  |
|                    |  Password                          |                  |
|                    |  [                          (!) ]  |  <- danger border|
|                    |  Wrong e-mail or password. Check   |                  |
|                    |  both and try again.               |                  |
|                    |                                    |                  |
|                    |  [           Sign in            ]  |                  |
|                    |  Too many attempts. Wait a moment  |                  |
|                    |  and try again.                    |                  |
|                    +------------------------------------+                  |
+----------------------------------------------------------------------------+
                        ^                             ^
                        field-level: border and        form-level: sits under
                        helper text switch to          the submit control
                        danger, error icon trails      because no single field
                        the field                      caused it
```

`INVALID_CREDENTIALS` is drawn against the password field, and `EMAIL_TAKEN`
against the e-mail field on `/sign-up`. `TOO_MANY_ATTEMPTS` and
`REGISTRATION_CLOSED` have no owning field, so they render attached to the form
directly under the submit control — the closest §8 allows without becoming the
disconnected summary block it forbids. **Only one of the two error rows above is
ever on screen at once**; they are drawn together to place both, not to stack
them.

**Design rules**

- §5 Inputs (error) — border and helper text switch to `danger` and an error icon
  appears trailing the field
- §8 Validation and error messages — inline, next to the field that caused them,
  never a summary block disconnected from the fields
- §11 Error messages — what went wrong, then what to do, in that order; no
  apology and no "Something went wrong"
- §13 One whole sentence — each message is written as a complete sentence and
  never assembled from fragments at render time
- §3 Semantic colors — `danger` for the border, the icon and the helper text

**Screen:** `/sign-up`

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                    +------------------------------------+                  |
|                    |  Create account                    |                  |
|                    |                                    |                  |
|                    |  E-mail                            |                  |
|                    |  [                              ]  |                  |
|                    |  Used to sign in. Never mailed.    |                  |
|                    |                                    |                  |
|                    |  Password                          |                  |
|                    |  [                              ]  |                  |
|                    |  8 to 128 characters.              |                  |
|                    |                                    |                  |
|                    |  [       Create account         ]  |                  |
|                    |                                    |                  |
|                    |  Already have an account? Sign in  |                  |
|                    +------------------------------------+                  |
|                                                                            |
+----------------------------------------------------------------------------+
```

The two helper lines are the screen's whole account of `FR.1.2` and `FR.1.3`: the
e-mail is an identifier that is never verified and never sent to, and the
password has bounds but no composition rules. Saying so up front is cheaper than
a validation error that says it afterwards. There is no password confirmation
field and no strength meter — neither is a requirement, and `FR.1.5` has no
self-service reset to make a typo recoverable, which is an accepted alpha cost
recorded in the roadmap rather than a gap this screen papers over.

**Design rules**

- §5 Inputs — the same spec as sign-in, with helper text in `textSecondary` until
  it turns `danger`
- §11 Button labels — "Create account" names the action, not "Submit" or "Go"
- §11 Tone — plain and factual; the helper lines state what is true with no
  reassurance copy
- §13 Length budget +40% — "Create account" → "Criar conta" and the helper
  sentences are all sized against the real Portuguese catalogue string
- §9 Focus indicators and ARIA — helper text is associated with its input by
  `aria-describedby`, so it is announced with the field

**Screen:** `/sign-up` — registration closed

```
+----------------------------------------------------------------------------+
|  Tormented Path: Mortal Ways                                     [ EN v ]  |
+----------------------------------------------------------------------------+
|                                                                            |
|                    +------------------------------------+                  |
|                    |  Sign-ups are closed               |                  |
|                    |                                    |                  |
|                    |  New accounts are closed for now.  |                  |
|                    |  Sign in if you already have one.  |                  |
|                    |                                    |                  |
|                    |  [           Sign in            ]  |                  |
|                    +------------------------------------+                  |
|                                                                            |
+----------------------------------------------------------------------------+
                        ^
                        the route still resolves and the shell is unchanged:
                        the notice replaces the form inside the same card,
                        rather than redirecting or 404-ing
```

This is §8's empty state, applied to a form: a short `textSecondary` line plus a
single button, because there is exactly one thing the player can do about it.
Meanwhile `/`'s "Create one" link is gone entirely, so this screen is reachable
only by a player who kept the URL.

**Design rules**

- §8 Empty states — a short `textSecondary` line plus a single button where an
  action would resolve it
- §5 Buttons (Primary) — the one action gets the primary treatment; there is no
  secondary control to compete with it
- §11 Tone — plain and factual, no apology for the closure
- §13 One whole sentence — both lines are complete sentences in each catalogue
