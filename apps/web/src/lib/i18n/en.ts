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
    // wireframe 07: the signed-in account menu trigger and its sign-out row.
    account: 'Account',
    signOut: 'Sign out',
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
    // auth.md rule 27: the server translates the library's error into one of
    // these codes; the web renders the code, never the message.
    EMAIL_TAKEN: 'That address already has an account. Sign in instead.',
    INVALID_CREDENTIALS: 'Wrong e-mail or password. Check both and try again.',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Wait a moment and try again.',
    REGISTRATION_CLOSED:
      'New accounts are closed for now. Sign in if you already have one.',
  },
  session: {
    // wireframe 07: the aria-live label while the session resolves.
    loading: 'Loading your account.',
  },
  // wireframe 08: design.md §5's Inputs and Buttons, §11's verb-first labels.
  auth: {
    email: 'E-mail',
    password: 'Password',
  },
  signIn: {
    title: 'Sign in',
    submit: 'Sign in',
    createLink: 'No account yet? Create one',
  },
  signUp: {
    title: 'Create account',
    submit: 'Create account',
    emailHelper: 'Used to sign in. Never mailed.',
    passwordHelper: '8 to 128 characters.',
    signInLink: 'Already have an account? Sign in',
    closedTitle: 'Sign-ups are closed',
    closedBody:
      'New accounts are closed for now. Sign in if you already have one.',
    closedCta: 'Sign in',
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
