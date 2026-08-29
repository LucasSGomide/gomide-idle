/** @vitest-environment jsdom */
import { QueryClientProvider } from '@tanstack/react-query';
import {
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

import { useSignOut } from './use-sign-out';

// FR.2.4 / auth.md rule 4: sign-out is the generated mutation; on settle the
// session query is dropped and the player lands on `/`.
describe('useSignOut', () => {
  it('calls the generated mutation, drops the session query and lands on /', async () => {
    let hit = false;
    mockServer.use(
      http.post('*/auth/sign-out', () => {
        hit = true;
        return HttpResponse.json({ success: true });
      }),
    );

    const queryClient = makeQueryClient();
    queryClient.setQueryData(getAuthControllerGetCurrentSessionQueryKey(), {
      status: 200,
      data: { user: { id: 'u', email: 'a@b.c' }, registrationOpen: true },
    });

    const rootRoute = createRootRoute();
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

    (await screen.findByText('leave')).click();

    await waitFor(() => expect(hit).toBe(true));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(
      queryClient.getQueryData(getAuthControllerGetCurrentSessionQueryKey()),
    ).toBeUndefined();
  });
});
