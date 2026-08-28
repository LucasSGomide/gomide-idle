import preset from '../../jest.preset.mjs';

/** @type {import('jest').Config} */
export default {
  ...preset,
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup/reflect-metadata.ts'],
  // Boundary-check fixtures are deliberate rule violations, never compiled as
  // part of the app; only test/boundaries.spec.ts loads them, through
  // dependency-cruiser's own API.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/fixtures/'],
};
