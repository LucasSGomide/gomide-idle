import preset from '../../jest.preset.mjs';

const common = {
  ...preset,
  rootDir: '.',
  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '^@gomide/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
  },
};

/** @type {import('jest').Config} */
export default {
  projects: [
    {
      ...common,
      displayName: 'unit',
      roots: ['<rootDir>/src', '<rootDir>/test'],
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/test/fixtures/',
        '<rootDir>/test/integration/',
      ],
    },
    {
      ...common,
      displayName: 'integration',
      roots: ['<rootDir>/test/integration'],
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/integration/support/'],
      globalSetup: '<rootDir>/test/integration/global-setup.ts',
      globalTeardown: '<rootDir>/test/integration/global-teardown.ts',
      testTimeout: 120_000,
      // socket.io-client leaves poll timers under Jest's vm-modules loader; the
      // suites all complete, so force a clean exit rather than hang CI.
      forceExit: true,
    },
  ],
};
