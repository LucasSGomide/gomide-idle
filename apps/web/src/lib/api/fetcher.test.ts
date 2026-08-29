/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, errorCode, fetcher, API_BASE_PATH } from './fetcher';

describe('the fetch mutator', () => {
  afterEach(() => vi.restoreAllMocks());

  // architecture-web.md rule 11 / FR.14.3: a relative base path and
  // `credentials` on every call, with no host compiled in.
  it('sends a relative base path and credentials, with no host in the URL', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await fetcher('/server-meta', { method: 'GET' });

    expect(spy).toHaveBeenCalledOnce();
    const [url, init] = spy.mock.calls[0]!;
    expect(url).toBe(`${API_BASE_PATH}/server-meta`);
    expect(String(url).startsWith('/')).toBe(true);
    expect(String(url)).not.toMatch(/^https?:/);
    expect((init as RequestInit).credentials).toBe('include');
  });

  it('resolves the Orval envelope on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ buildId: 'x' }), { status: 200 }),
    );
    const result = await fetcher<{ status: number; data: { buildId: string } }>(
      '/server-meta',
    );
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ buildId: 'x' });
  });

  it('throws an ApiError carrying the code, not the message, on a non-2xx', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ code: 'INTERNAL_ERROR', message: 'pg down' }),
          { status: 500 },
        ),
      ),
    );
    const error = await fetcher('/server-meta').catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });

  it('maps a non-ApiError to INTERNAL_ERROR for the catalogue', () => {
    expect(errorCode(new Error('offline'))).toBe('INTERNAL_ERROR');
    expect(errorCode(new ApiError(400, 'VALIDATION_FAILED', 'x'))).toBe(
      'VALIDATION_FAILED',
    );
  });
});
