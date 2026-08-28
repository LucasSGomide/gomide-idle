import preset from '../../jest.preset.mjs';

/** @type {import('jest').Config} */
export default {
  ...preset,
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
};
