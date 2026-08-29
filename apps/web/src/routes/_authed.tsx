import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { resolveSession } from '@/features/session/require-session';

import { AuthError } from './-shell/auth-error';
import { AuthPending } from './-shell/auth-pending';

// architecture-web.md rule 22 / auth.md rule 24: the one guard. It resolves the
// session in beforeLoad before a protected screen renders and redirects to `/`
// with the attempted path in a search param for sign-in to return the player to
// (auth.md rule 25). A cold load shows the spinner (pendingMs: 0); a warm cache
// resolves synchronously with no flash. A failed session read renders from its
// `code` (rule 27).
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const session = await resolveSession(context.queryClient);
    if (!session.user) {
      throw redirect({ to: '/', search: { redirect: location.pathname } });
    }
  },
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: AuthPending,
  errorComponent: ({ error }) => <AuthError error={error} />,
  component: () => <Outlet />,
});
