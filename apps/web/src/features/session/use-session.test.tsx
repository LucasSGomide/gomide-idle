/** @vitest-environment jsdom */
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { makeQueryClient } from '@/lib/testing/render';

import { useSession } from './use-session';

// architecture-web.md rule 33 / auth.md rule 23: the session is read through the
// generated query hook, against the generated MSW handler.
describe('useSession', () => {
  function wrap() {
    const queryClient = makeQueryClient();
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  it('unwraps the envelope to { user, registrationOpen }', async () => {
    mockServer.use(
      http.get('*/auth/session', () =>
        HttpResponse.json({
          user: { id: 'u1', email: 'ada@example.com' },
          registrationOpen: true,
        }),
      ),
    );
    const { result } = renderHook(() => useSession(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      user: { id: 'u1', email: 'ada@example.com' },
      registrationOpen: true,
    });
  });

  it('reads a signed-out session as { user: null }', async () => {
    mockServer.use(
      http.get('*/auth/session', () =>
        HttpResponse.json({ user: null, registrationOpen: false }),
      ),
    );
    const { result } = renderHook(() => useSession(), { wrapper: wrap() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user).toBeNull();
    expect(result.current.data?.registrationOpen).toBe(false);
  });
});
