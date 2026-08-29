/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { makeQueryClient } from '@/lib/testing/render';

import { useServerMeta } from './use-server-meta';

// stack-web.md rule 58 / FR.15.4: the generated hook runs for real against the
// generated MSW handlers — a typed response with no live server and no module
// mock.
describe('useServerMeta', () => {
  it('resolves a typed ServerMetaResponse through the generated MSW handler', async () => {
    mockServer.use(
      http.get('*/server-meta', () =>
        HttpResponse.json({
          socketProtocolVersion: 1,
          contentPackVersion: '2026.08.1',
          buildId: 'abc1234',
        }),
      ),
    );

    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useServerMeta(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      socketProtocolVersion: 1,
      contentPackVersion: '2026.08.1',
      buildId: 'abc1234',
    });
  });

  it('exposes the URL-shaped generated query key', () => {
    const queryClient = makeQueryClient();
    const { result } = renderHook(() => useServerMeta(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });
    expect(result.current.queryKey).toEqual(['/server-meta']);
  });
});
