// architecture-web.md rules 6-13 / stack-web.md rule 60 / FR.12.2: the six
// folders and their import rules, checked as their own step because oxlint
// cannot express a path-to-path rule. Run from apps/web so the tsConfig path
// aliases resolve.
//
// The patterns are not anchored to `^src/` so the same ruleset also fires
// against the fixtures under test/fixtures/boundaries/, which is how
// test/boundaries.spec.ts proves each rule catches what it should.
//
// tsPreCompilationDeps is load-bearing: a violation written `import type` still
// counts (FR.12.3) rather than vanishing at compile time.

const FEATURE = '(^|/)features/([^/]+)/'; // $2 is the feature folder name
const SIX = '(routes|features|renderer|transport|ui|lib)';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-folder-beside-the-six',
      comment:
        'architecture-web.md rule 6: src/ gets exactly routes, features, ' +
        'renderer, transport, ui and lib — plus the entry point and the three ' +
        'generated files, and nothing else.',
      severity: 'error',
      from: {
        path: `(^|/)(src|boundaries)/(?!${SIX}/)[^/]+/[^/]+`,
      },
      to: { path: '.+' },
    },
    {
      name: 'no-cross-feature-import',
      comment:
        'architecture-web.md rule 7: never import one feature from another. ' +
        'The $2 back-reference is the shape neither linter can state.',
      severity: 'error',
      from: { path: FEATURE },
      to: { path: FEATURE, pathNot: '(^|/)features/$2/' },
    },
    {
      name: 'ui-knows-no-feature',
      comment:
        'architecture-web.md rule 9: ui/ knows nothing about any feature — no ' +
        'import from features/.',
      severity: 'error',
      from: { path: '(^|/)ui/' },
      to: { path: '(^|/)features/' },
    },
    {
      name: 'renderer-admits-only-the-theme-module',
      comment:
        'architecture-web.md rules 10, 30 / FR.12.2: nothing is imported into ' +
        'renderer/ but the generated theme module (src/theme.ts).',
      severity: 'error',
      from: { path: '(^|/)renderer/' },
      to: {
        path: '(^|/)(routes|features|transport|ui|lib)/',
      },
    },
    {
      name: 'socket-io-only-in-transport',
      comment:
        'architecture-web.md rule 12: import the socket library only in ' +
        'transport/, so decoding a frame and knowing which library delivered ' +
        'it stay two jobs.',
      severity: 'error',
      from: { path: `(^|/)(routes|features|renderer|ui|lib)/` },
      to: { path: '(^|/)node_modules/socket[.]io-client(/|$)' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: [
        'import',
        'require',
        'node',
        'default',
        'types',
        'browser',
      ],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'],
    },
    doNotFollow: { path: '(^|/)node_modules/' },
  },
};
