/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  errorCode,
  fetcher,
  setUnauthorizedHandler,
  API_BASE_PATH,
} from './fetcher';

describe('the fetch mutator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setUnauthorizedHandler(undefined);
  });

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

  // Fastify raises FST_ERR_CTP_EMPTY_JSON_BODY — a 400 before the handler runs
  // — for `Content-Type: application/json` with no body. Declaring the header on
  // a bodyless POST is what made sign-out 400 and the player never leave the
  // screen, so the header rides with the body or not at all.
  it('omits Content-Type on a request with no body', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );

    await fetcher('/auth/sign-out', { method: 'POST' });

    const init = spy.mock.calls[0]![1] as RequestInit;
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('sends Content-Type on a request that carries a body', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await fetcher('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.c', password: 'x' }),
    });

    const init = spy.mock.calls[0]![1] as RequestInit;
    expect(init.headers).toHaveProperty('Content-Type', 'application/json');
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

  // task 08 AC8 / auth.md rule 26: a 401 on any request runs the one registered
  // handler (main.tsx clears the session query and returns to sign-in), and the
  // error still surfaces as an ApiError.
  it('runs the unauthorized handler exactly once on a 401 and still throws', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'NO_SESSION', message: 'x' }), {
        status: 401,
      }),
    );

    const error = await fetcher('/characters/gear').catch((caught) => caught);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401 });
  });

  it('does not run the unauthorized handler on a non-401 error', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'INTERNAL_ERROR' }), { status: 500 }),
    );

    await fetcher('/server-meta').catch(() => undefined);
    expect(handler).not.toHaveBeenCalled();
  });
});
