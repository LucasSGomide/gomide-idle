import type { QueryClient } from '@tanstack/react-query';

import { getAuthControllerGetCurrentSessionQueryKey } from '@/lib/api/generated/tormented-path';

// The structural slice of the router this needs. Typing against the app's
// concrete router would drag the route tree into a module main.tsx imports
// before the router exists.
export type SignInNavigator = {
  state: { location: { pathname: string } };
  navigate: (options: { to: '/'; search: { redirect: string } }) => unknown;
};

// auth.md rule 26: a 401 is handled in exactly one place. This is that place's
// body; main.tsx wires it to the concrete router and cache.
//
// The third twin of `use-sign-out.ts` and `use-refresh-session.ts`, and it
// invalidates for the same reason they do: `removeQueries` destroys the query
// the top bar's `useSession` is subscribed to and strands that observer, so the
// chrome disagreed with the server about who is signed in — an account menu on
// the sign-in screen when the session really was gone, and no account menu at
// all (so no way to sign out) when the 401 came from something other than an
// expired session. Invalidation refetches in place and notifies every observer.
export function createUnauthorizedHandler(
  queryClient: QueryClient,
  router: SignInNavigator,
): () => void {
  return () => {
    const from = router.state.location.pathname;
    void queryClient
      .invalidateQueries({
        queryKey: getAuthControllerGetCurrentSessionQueryKey(),
      })
      // Awaited so `/`'s guard reads the settled session rather than racing the
      // refetch, exactly as the twins do.
      .then(() => router.navigate({ to: '/', search: { redirect: from } }));
  };
}
