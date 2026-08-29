import type { QueryClient } from '@tanstack/react-query';

import {
  getAuthControllerGetCurrentSessionQueryOptions,
  type authControllerGetCurrentSessionResponse,
} from '@/lib/api/generated/tormented-path';
import type { SessionResponse } from '@/lib/api/generated/model';

// auth.md rule 24: _authed.tsx's beforeLoad resolves the session before a
// protected screen renders. This reads it through the same query cache the
// useSession hook uses (stack-web.md rule 40), so the component below never
// re-fetches.
export async function resolveSession(
  queryClient: QueryClient,
): Promise<SessionResponse> {
  const envelope = (await queryClient.ensureQueryData(
    getAuthControllerGetCurrentSessionQueryOptions(),
  )) as authControllerGetCurrentSessionResponse;
  return envelope.data;
}
