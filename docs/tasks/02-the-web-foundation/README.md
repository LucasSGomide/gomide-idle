# 02 — The web foundation: shell, design system and the first rendered screen

Sliced so each task leaves the repository green on its own. Tasks `01`, `02`, `03`
and `05` render nothing — they are the folder shape and its boundary checker, the
token pipeline and the fonts, the two catalogues, and the generated client. Each
exists as its own slice because the thing it settles is a convention every later
slice reads.

`04` is the first screen: the router, the shell and the top bar. It sits behind
`02` and `03` because the bar's only control is the language switcher, and a bar
built before the tokens and the catalogues is a bar built twice — which is the
whole point of `UN.16`. `06` is where `UN.10`'s path visibly completes, and it
carries the error boundary because the footer's error state is the only thing in
this item that exercises it. `07` is the socket half, and needs only the shell.

Roadmap item `01`'s regenerate command and CI workflow are extended by whichever
slice creates the artifact — `01` adds the boundary checker and the test jobs,
`02` the theme drift check, `04` the route tree, `05` Orval's output — rather
than collected into a task of their own.

| # | Task | Scope | Depends on | Criteria | Status |
|---|---|---|---|---|---|
| [01](01-web-scaffold-six-folders-and-boundary-checker.md) | The web app scaffold, its six folders and the boundary checker | front-end | — | 0/8 | not-started |
| [02](02-token-generator-theme-and-tailwind.md) | The token generator, the theme, the fonts and Tailwind v4 | front-end | 01 | 0/8 | not-started |
| [03](03-i18n-catalogues-typed-resources-and-mirror.md) | Both catalogues, the typed resources and the `localStorage` mirror | front-end | 01 | 0/7 | not-started |
| [04](04-router-shell-and-top-bar.md) | The router, the root shell and the top bar | front-end | 02, 03 | 0/8 | not-started |
| [05](05-generated-client-mutator-and-msw.md) | The generated client, the fetch mutator and the network fake | front-end | 01 | 0/5 | not-started |
| [06](06-error-boundary-catalogue-and-footer.md) | The error boundary, the error catalogue and the footer | front-end | 04, 05 | 0/8 | not-started |
| [07](07-socket-client-and-out-of-date-screen.md) | The socket client and the out-of-date screen | front-end | 04 | 0/6 | not-started |
