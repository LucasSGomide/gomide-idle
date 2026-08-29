import { useQueryClient } from '@tanstack/react-query';

import { getAuthControllerGetCurrentSessionQueryKey } from '@/lib/api/generated/tormented-path';

// After sign-in or sign-up the server has set a new session cookie, so the
// cached `GET auth/session` is stale. Invalidating it makes the next read — the
// redirect target's `_authed`/`/` guard, and the shell's session-aware chrome —
// see the signed-in state.
//
// Invalidate rather than remove: `removeQueries` destroys the query the top bar
// is subscribed to and strands that observer on the envelope it last read, so
// the chrome kept offering the signed-out language switcher after a successful
// sign-in. The returned promise settles once the refetch has, which lets the
// caller navigate into a guard that reads the result rather than racing it. The
// twin of this is `use-sign-out.ts`.
export function useRefreshSession(): () => Promise<void> {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: getAuthControllerGetCurrentSessionQueryKey(),
    });
}
