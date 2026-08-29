import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import orvalConfig from '../orval.config';
import viteConfig from '../vite.config';

const require = createRequire(import.meta.url);

type ProxyEntry = {
  target?: string;
  ws?: boolean;
  rewrite?: (p: string) => string;
};
const proxy = (
  viteConfig as { server?: { proxy?: Record<string, ProxyEntry> } }
).server?.proxy;

// task 06 / stack-web.md rule 62 / FR.14.3: one origin in the fast loop.
describe('the dev server proxy', () => {
  it('proxies /api to the API port so fetcher.ts resolves to Nest, not Vite', () => {
    const api = proxy?.['/api'];
    expect(api?.target).toMatch(/:3000$/);
    // the `/api` prefix is the proxy's; Nest serves at the root
    expect(api?.rewrite?.('/api/auth/sign-up')).toBe('/auth/sign-up');
  });

  it('proxies the socket path with ws:true so the handshake reaches the gateway', () => {
    const socket = proxy?.['/socket.io'];
    expect(socket?.target).toMatch(/:3000$/);
    expect(socket?.ws).toBe(true);
  });
});

// task 06 AC6 / stack-web.md rule 61.
describe("Orval's config and version", () => {
  const output = (
    orvalConfig as unknown as {
      api: { output: { httpClient?: string; mock?: unknown } };
    }
  ).api.output;
  const pkg = require('../package.json') as {
    devDependencies: Record<string, string>;
  };

  it('is pinned at 8.0.2 or later', () => {
    const range = pkg.devDependencies.orval ?? '';
    const major = Number(range.replace(/[^0-9.]/g, '').split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(8);
  });

  it('asks for a fetch HTTP client and MSW handlers alone (not mock:true, not axios)', () => {
    expect(output.httpClient).toBe('fetch');
    expect(output.mock).toEqual({ generators: [{ type: 'msw' }] });
    expect(output.mock).not.toBe(true);
    expect(JSON.stringify(orvalConfig)).not.toMatch(/axios/);
  });
});
