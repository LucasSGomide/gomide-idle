# 02 — The token generator, the theme, the fonts and Tailwind v4

**Roadmap:** [02](../../roadmap/02-the-web-foundation.md) · **Scope:** front-end · **Depends on:** 01

## Context

- `stack-web.md` rule 45 says the JSON-path-to-custom-property mapping "lives in
  the generator", and no generator exists. This slice fixes that convention, and
  every token read in every later slice depends on the shape it settles.
- Tailwind v4 is configured over the generated theme so no component ever carries
  a raw colour, size, radius or duration.
- Primitives are copied into `ui/` and edited in place rather than wrapped, so
  there is no second layer to keep in sync with the first.
- The font loading in this slice covers `FR.16.3`, which `UN.16` requires and the
  roadmap item's twelve steps do not name. It lands here because this is the slice
  that owns the visual system; without it the first rendered screen in `04` would
  flash invisible text.
- Nothing renders in this slice.

## User experience

- **States** — nothing renders. This slice ships the theme, the fonts and the
  primitives; the first screen that uses them arrives in task `04`.

## Technical details

- **Web stack** — write the token generator: `docs/design-tokens.json` to
  `apps/web/src/theme.css` and `theme.ts`, mapping `color.accent.default` to
  `--color-accent` and `spacing.5` to `--spacing-5`; `stack-web.md` rules 45–47.
- **Web stack** — commit both outputs, add the generator to `01`'s regenerate
  command, and add the CI step that regenerates and fails on a difference.
- **Web stack** — add Tailwind v4 over that theme, so no component contains a raw
  value; `stack-web.md` rules 45–47.
- **Web stack** — load both interface fonts with a declared fallback stack that
  swaps in without a flash of invisible text.
- **Front-end** — copy into `ui/` only the primitives the shell needs, edited in
  place rather than wrapped; the theme module is the one thing `renderer/` admits;
  `architecture-web.md` rules 6–13.
- **Design** — every primitive is sized against the Portuguese string and nothing
  truncates.

## Acceptance criteria

- [ ] `(unit)` the generator maps `color.accent.default` to `--color-accent` and `spacing.5` to `--spacing-5`
- [ ] `(unit)` the generator emits a `theme.ts` whose exported names match the custom properties in `theme.css`
- [ ] `(integration)` running the generator over the committed `docs/design-tokens.json` reproduces the committed `theme.css` and `theme.ts` exactly
- [ ] `(integration)` CI fails when `docs/design-tokens.json` changes and the outputs are not regenerated
- [ ] `(integration)` a Tailwind utility resolves to a generated custom property in the built CSS
- [ ] `(integration)` no file under `ui/` contains a raw colour, size, radius or duration
- [ ] `(unit)` both fonts declare a fallback stack and are loaded with a swap that renders fallback text immediately
- [ ] `(unit)` each copied primitive renders its Portuguese label without truncation at the shell's narrowest supported width

## References

- `stack-web.md` rules 45–47 — the token pipeline and the ban on raw values.
- `architecture-web.md` rules 6–13 — the six folders and the import rules.
- `design.md` — the visual system the tokens and primitives realise.
- `requirements.md` `FR.16.1` — the theme is generated from the design token file
  and no component contains a raw colour, size, radius or duration.
- `requirements.md` `FR.16.3` — both interface fonts load with a declared fallback
  stack and swap in without a flash of invisible text.
- `requirements.md` `FR.11.6` — one command regenerates everything.

## Implement with

`/web-feature`
