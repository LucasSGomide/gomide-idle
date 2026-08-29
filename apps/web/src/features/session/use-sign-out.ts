import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import {
  getAuthControllerGetCurrentSessionQueryKey,
  useAuthControllerPostSignOut,
} from '@/lib/api/generated/tormented-path';

// FR.2.4 / auth.md rule 4: sign-out is the generated mutation, nothing
// hand-written. On success the session query is re-read and the player lands on
// `/`; the server has already closed that session's socket (task 05).
export function useSignOut(): { signOut: () => void; isPending: boolean } {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useAuthControllerPostSignOut();

  const signOut = (): void => {
    mutation.mutate(undefined, {
      // Invalidate rather than remove. `removeQueries` destroys the query the
      // top bar's own `useSession` is subscribed to, and that observer is left
      // holding the signed-in envelope it last read — which is why the chrome
      // still offered the account menu on the sign-in screen. Invalidation
      // refetches in place and notifies every observer, and awaiting it means
      // `/`'s guard reads the settled result instead of racing it.
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: getAuthControllerGetCurrentSessionQueryKey(),
        });
        void navigate({ to: '/' });
      },
    });
  };

  return { signOut, isPending: mutation.isPending };
}
