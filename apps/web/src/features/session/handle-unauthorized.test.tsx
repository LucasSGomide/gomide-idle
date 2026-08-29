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

import { createUnauthorizedHandler } from './handle-unauthorized';
import { useSession } from './use-session';

// Stands in for the top bar (`routes/-shell/top-bar.tsx`): session-aware chrome
// mounted above the route that outlives the 401's navigation. It is the
// observer `removeQueries` strands.
function Chrome() {
  const session = useSession();
  if (session.isPending) return <p>chrome pending</p>;
  return <p>{session.data?.user ? 'account menu' : 'signed out'}</p>;
}

function renderApp(pathname: string) {
  const queryClient = makeQueryClient();
  // The cache the guard filled before the protected screen rendered.
  queryClient.setQueryData(getAuthControllerGetCurrentSessionQueryKey(), {
    status: 200,
    data: { user: { id: 'u', email: 'a@b.c' }, registrationOpen: true },
  });

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
    component: () => <p>sign in</p>,
  });
  const charactersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/characters',
    component: () => <p>characters</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, charactersRoute]),
    history: createMemoryHistory({ initialEntries: [pathname] }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { queryClient, router };
}

// auth.md rule 26: the one 401 handler. Whatever it does to the cache, the
// chrome has to end up agreeing with the server about who is signed in.
describe('the 401 handler', () => {
  it('leaves the chrome signed out when the session really is gone', async () => {
    mockServer.use(
      http.get('*/auth/session', () =>
        HttpResponse.json({ user: null, registrationOpen: true }),
      ),
    );

    const { queryClient, router } = renderApp('/characters');
    expect(await screen.findByText('account menu')).toBeTruthy();

    createUnauthorizedHandler(queryClient, router)();

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByText('signed out')).toBeTruthy();
  });

  // The other direction. This one holds under `removeQueries` too — the
  // observer refetches and recovers — so it is not a regression test, it pins
  // the invariant the first case only checks one half of: after a 401 the
  // chrome shows what the server says, whichever way the answer goes.
  it('keeps the account menu when the 401 did not come from an expired session', async () => {
    mockServer.use(
      http.get('*/auth/session', () =>
        HttpResponse.json({
          user: { id: 'u', email: 'a@b.c' },
          registrationOpen: true,
        }),
      ),
    );

    const { queryClient, router } = renderApp('/characters');
    expect(await screen.findByText('account menu')).toBeTruthy();

    createUnauthorizedHandler(queryClient, router)();

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    // The player can still reach sign-out: the chrome never lost the session it
    // is subscribed to.
    expect(await screen.findByText('account menu')).toBeTruthy();
    expect(screen.queryByText('chrome pending')).toBeNull();
  });
});
