// Shared Jest configuration. Every package's jest.config.mjs spreads this so the
// ESM setup (stack-api.md rules 32-33) lives in one file. Runs need
// NODE_OPTIONS=--experimental-vm-modules, which each package's test script sets.
/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'mjs', 'js', 'json'],
  moduleNameMapper: {
    // NodeNext requires .js specifiers on relative TS imports; strip for Jest.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { useESM: true, tsconfig: '<rootDir>/tsconfig.json' },
    ],
  },
  clearMocks: true,
};
