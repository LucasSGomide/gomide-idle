# 03 — Both catalogues, the typed resources and the `localStorage` mirror

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** 01

## Context

- The shell has to paint from the mirrored language synchronously at startup, so
  the read must exist before anything renders. Building the top bar first would
  mean building it twice, which is exactly what `UN.16` exists to prevent.
- Both catalogues are typed off English, so a missing or misspelled Portuguese key
  fails the build instead of rendering the key on screen.
- There is no account yet, so the switcher writes to `localStorage` and nowhere
  else. The Account item later carries the choice to a profile; nothing here
  anticipates that.
- This slice ships the module and its writer. The switcher control that calls it
  renders in task `04`.

## User experience

- **Flow** — the shell paints from the language mirrored in `localStorage`, read
  synchronously at startup, so a returning Portuguese player never sees an English
  frame.
- **Flow** — switching language re-renders every string at once and writes to
  `localStorage` alone; there is no account to carry the choice to yet.
- **States** — nothing renders in this slice; the switcher control that drives it
  arrives with the top bar in task `04`.

## Technical details

- **Web stack** — add react-i18next 17 and i18next 26 with English and Portuguese
  catalogues in `lib/i18n/`; `stack-web.md` rules 48–53.
- **Web stack** — a `react-i18next.d.ts` declaring `CustomTypeOptions['resources']`
  as `typeof en`, with `returnNull: false`.
- **Web stack** — the Portuguese catalogue written `satisfies typeof en`.
- **Web stack** — read the mirrored language from `localStorage` synchronously at
  startup, and expose the single writer the switcher calls.
- **Front-end** — i18n lives in `lib/`, imported by `features/` and `ui/` and
  importing neither; `architecture-web.md` rules 6–13.

## Acceptance criteria

- [ ] `(unit)` the Portuguese catalogue fails to type-check when a key present in English is missing from it
- [ ] `(unit)` an unknown key is a compile error against `CustomTypeOptions['resources']`
- [ ] `(unit)` `t` returns a `string` and never `null`, with `returnNull: false` in force
- [ ] `(unit)` startup reads the mirrored language from `localStorage` synchronously, before the first render
- [ ] `(unit)` startup falls back to English when `localStorage` holds nothing, or holds an unknown value
- [ ] `(unit)` the writer stores the chosen language in `localStorage` and issues no network call
- [ ] `(unit)` switching language re-renders every mounted string at once

## References

- `stack-web.md` rules 48–53 — both catalogues, the typed resources, the
  `localStorage` mirror and the signed-out switcher.
- `architecture-web.md` rules 6–13 — the six folders and the import rules.
- `design.md` — the language the shell is sized against.
- `requirements.md` `FR.16.4` — English and Portuguese catalogues both ship, typed
  so a missing or misspelled key fails the build instead of rendering the key.

## Implement with

`/web-feature`
