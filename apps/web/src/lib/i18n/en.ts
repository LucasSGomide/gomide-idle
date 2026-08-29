// stack-web.md rules 48-50: English is the source catalogue. The Portuguese one
// is written `satisfies typeof en`, and react-i18next.d.ts declares
// CustomTypeOptions['resources'] as `typeof en` — so a missing or misspelled key
// fails the build instead of rendering the key on screen (FR.16.4).
//
// stack-web.md rule 51: no hunt, monster, skill or item name lives here — those
// come from the content pack, untranslated. This catalogue is chrome only.
export const en = {
  topBar: {
    // design.md §13: the switcher trigger is a real <button> with an accessible
    // name; the language names themselves are shown each in its own language and
    // are never translation keys (see SUPPORTED_LANGUAGES in language.ts).
    languageSwitcher: {
      label: 'Change language',
    },
  },
  footer: {
    // design.md wireframe: one whole string with a placeholder, never assembled
    // from fragments at render time (§13).
    protocol: 'protocol {{version}}',
    contentPack: 'content-pack {{version}}',
    build: 'build {{id}}',
  },
  errors: {
    // architecture-web.md rule 27 / naming.md rule 15: keyed off the
    // SCREAMING_SNAKE_CASE error `code`. GENERIC is what an unrecognised code
    // renders, rather than the raw code.
    GENERIC: 'Something went wrong. Reload to try again.',
    INTERNAL_ERROR: 'Version details are unavailable. Reload to try again.',
    VALIDATION_FAILED: 'The request was rejected. Reload to try again.',
  },
  errorBoundary: {
    title: 'This section could not be loaded.',
    reload: 'Reload',
  },
  outOfDate: {
    title: 'Your client is out of date.',
    body: 'Reload the page to continue.',
    reload: 'Reload',
  },
};
