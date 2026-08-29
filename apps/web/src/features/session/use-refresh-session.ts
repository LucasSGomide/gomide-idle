import { useQueryClient } from '@tanstack/react-query';

import { getAuthControllerGetCurrentSessionQueryKey } from '@/lib/api/generated/tormented-path';

// After sign-in or sign-up the server has set a new session cookie, so the
// cached `GET auth/session` is stale. Dropping it makes the next read — the
// redirect target's `_authed`/`/` guard, and the shell's session-aware chrome —
// re-fetch and see the signed-in state.
export function useRefreshSession(): () => void {
  const queryClient = useQueryClient();
  return () =>
    queryClient.removeQueries({
      queryKey: getAuthControllerGetCurrentSessionQueryKey(),
    });
}
