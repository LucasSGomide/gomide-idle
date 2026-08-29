import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { mockServer } from './src/lib/api/mock-server';

// stack-web.md rule 58 / FR.15.4: MSW at the network boundary from the first
// test — the generated hooks run for real against handlers Orval generated from
// the same document, so a test fakes the server, never a module.
beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
