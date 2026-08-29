/** @vitest-environment jsdom */
// jsdom for the document origin alone: the fetch mutator sends a relative
// `/api` path (one-origin, fetcher.ts), which has no base to resolve against in
// the node environment.
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { getAuthControllerGetCurrentSessionQueryKey } from '@/lib/api/generated/tormented-path';
import { makeQueryClient } from '@/lib/testing/render';

import { SESSION_STALE_TIME_MS } from './use-session';
import { resolveSession } from './require-session';

// auth.md rule 24: the guards resolve the session through the query cache. What
// the cache must not do is latch: a session that dies while the tab is open has
// to become visible to the next guard that asks, or `/` redirects a signed-out
// player to a screen they cannot see and never draws the sign-in form.
describe('resolveSession', () => {
  const signedIn = {
    status: 200,
    data: { user: { id: 'u', email: 'a@b.c' }, registrationOpen: true },
  };

  it('re-reads once the cached session has gone stale', async () => {
    mockServer.use(
      http.get('*/auth/session', () =>
        HttpResponse.json({ user: null, registrationOpen: true }),
      ),
    );

    const queryClient = makeQueryClient();
    // Signed in as far as this tab last knew — and old enough to be stale.
    queryClient.setQueryData(
      getAuthControllerGetCurrentSessionQueryKey(),
      signedIn,
      { updatedAt: Date.now() - SESSION_STALE_TIME_MS - 1_000 },
    );

    // The server revoked it in the meantime; the guard has to see that.
    expect(await resolveSession(queryClient)).toEqual({
      user: null,
      registrationOpen: true,
    });
  });

  it('serves the cache while it is still fresh, so a burst of navigations makes one request', async () => {
    let requests = 0;
    mockServer.use(
      http.get('*/auth/session', () => {
        requests += 1;
        return HttpResponse.json({ user: null, registrationOpen: true });
      }),
    );

    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      getAuthControllerGetCurrentSessionQueryKey(),
      signedIn,
    );

    const first = await resolveSession(queryClient);
    const second = await resolveSession(queryClient);

    expect(first.user?.email).toBe('a@b.c');
    expect(second.user?.email).toBe('a@b.c');
    expect(requests).toBe(0);
  });
});
