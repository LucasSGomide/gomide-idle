// stack-api.md rule 42: the layer and folder boundaries architecture-api.md
// rules 19-24 describe, checked as its own step (oxlint cannot express a
// path-to-path rule). Run from apps/api so tsConfig path aliases resolve.
//
// Three options are load-bearing and none is the default:
//   tsPreCompilationDeps  - a violation written `import type` still counts
//                           (FR.12.3), rather than vanishing at compile time
//   combinedDependencies  - a pnpm workspace leaf package.json is read together
//                           with the root's
//   exportsFields         - an ESM dependency's `exports` map is honoured, so
//                           modern packages resolve instead of reporting as
//                           unresolvable

const MODULE = '(^|/)modules/([^/]+)/';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-imports-inward-only',
      comment:
        'architecture-api.md rules 19-20: domain/ imports nothing from the outer layers.',
      severity: 'error',
      from: { path: MODULE + 'domain/' },
      to: { path: MODULE + '(application|infrastructure|entrypoint)/' },
    },
    {
      name: 'application-imports-inward-only',
      comment: 'architecture-api.md rule 19: application/ may reach domain/ only.',
      severity: 'error',
      from: { path: MODULE + 'application/' },
      to: { path: MODULE + '(infrastructure|entrypoint)/' },
    },
    {
      name: 'infrastructure-not-entrypoint',
      comment: 'architecture-api.md rule 19: the outer ring peers do not import each other.',
      severity: 'error',
      from: { path: MODULE + 'infrastructure/' },
      to: { path: MODULE + 'entrypoint/' },
    },
    {
      name: 'entrypoint-not-infrastructure',
      comment: 'architecture-api.md rules 19, 24: entrypoint wires through application ports.',
      severity: 'error',
      from: { path: MODULE + 'entrypoint/' },
      to: { path: MODULE + 'infrastructure/' },
    },
    {
      name: 'domain-free-of-frameworks',
      comment:
        'architecture-api.md rule 20: nothing from NestJS, Drizzle, Socket.IO ' +
        'or the schema library is imported into domain/.',
      severity: 'error',
      from: { path: MODULE + 'domain/' },
      to: {
        path: '(^|/)(node_modules/(@nestjs/|drizzle-orm|drizzle-kit|socket[.]io|nestjs-zod)|libs/contracts/)',
      },
    },
    {
      name: 'no-sibling-module-import',
      comment:
        'stack-api.md rule 42 / FR.12.2: hunt reaching into character. The $2 ' +
        'back-reference is the shape neither linter can state at all.',
      severity: 'error',
      from: { path: MODULE },
      to: { path: MODULE, pathNot: '(^|/)modules/$2/' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.mjs', '.cjs', '.json'],
    },
    // Record the edge to a workspace lib or an external package, but do not
    // parse it — only apps/api's own tree is under this cruise.
    doNotFollow: { path: '(^|/)node_modules/|(^|/)libs/' },
  },
};
