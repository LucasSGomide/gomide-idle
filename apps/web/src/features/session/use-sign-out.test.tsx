/** @vitest-environment jsdom */
import { QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { getAuthControllerGetCurrentSessionQueryKey } from '@/lib/api/generated/tormented-path';
import { makeQueryClient } from '@/lib/testing/render';

import { useSession } from './use-session';
import { useSignOut } from './use-sign-out';

// FR.2.4 / auth.md rule 4: sign-out is the generated mutation; on settle the
// session query is re-read and the player lands on `/`.
describe('useSignOut', () => {
  it('calls the generated mutation, lands on / and leaves the chrome signed out', async () => {
    let hit = false;
    mockServer.use(
      http.post('*/auth/sign-out', () => {
        hit = true;
        return HttpResponse.json({ success: true });
      }),
      // The server has revoked the cookie by the time anything re-reads it.
      http.get('*/auth/session', () =>
        HttpResponse.json({ user: null, registrationOpen: true }),
      ),
    );

    const queryClient = makeQueryClient();
    queryClient.setQueryData(getAuthControllerGetCurrentSessionQueryKey(), {
      status: 200,
      data: { user: { id: 'u', email: 'a@b.c' }, registrationOpen: true },
    });

    // Stands in for the top bar: session-aware chrome that outlives the
    // navigation. It is the observer that `removeQueries` used to strand on the
    // signed-in envelope, leaving an account menu on the sign-in screen.
    function Chrome() {
      const session = useSession();
      if (session.isPending) return null;
      return <p>{session.data?.user ? 'account menu' : 'signed out'}</p>;
    }

    const rootRoute = createRootRoute({
      component: function Shell() {
        return (
          <>
            <Chrome />
            <Outlet />
          </>
        );
      },
    });
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <p>home</p>,
    });
    const charactersRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/characters',
      component: function Leave() {
        const { signOut } = useSignOut();
        return (
          <button type="button" onClick={signOut}>
            leave
          </button>
        );
      },
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([indexRoute, charactersRoute]),
      history: createMemoryHistory({ initialEntries: ['/characters'] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('account menu')).toBeTruthy();
    (await screen.findByText('leave')).click();

    await waitFor(() => expect(hit).toBe(true));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByText('signed out')).toBeTruthy();
  });
});
