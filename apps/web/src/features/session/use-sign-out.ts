import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import {
  getAuthControllerGetCurrentSessionQueryKey,
  useAuthControllerPostSignOut,
} from '@/lib/api/generated/tormented-path';

// FR.2.4 / auth.md rule 4: sign-out is the generated mutation, nothing
// hand-written. On success the session query is dropped and the player lands on
// `/`; the server has already closed that session's socket (task 05).
export function useSignOut(): { signOut: () => void; isPending: boolean } {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useAuthControllerPostSignOut();

  const signOut = (): void => {
    mutation.mutate(undefined, {
      onSettled: () => {
        queryClient.removeQueries({
          queryKey: getAuthControllerGetCurrentSessionQueryKey(),
        });
        void navigate({ to: '/' });
      },
    });
  };

  return { signOut, isPending: mutation.isPending };
}
