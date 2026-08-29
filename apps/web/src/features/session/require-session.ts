import type { QueryClient } from '@tanstack/react-query';

import {
  getAuthControllerGetCurrentSessionQueryOptions,
  type authControllerGetCurrentSessionResponse,
} from '@/lib/api/generated/tormented-path';
import type { SessionResponse } from '@/lib/api/generated/model';

import { SESSION_STALE_TIME_MS } from './use-session';

// auth.md rule 24: _authed.tsx's beforeLoad resolves the session before a
// protected screen renders. This reads it through the same query cache the
// useSession hook uses (stack-web.md rule 40), so the component below never
// re-fetches.
//
// `fetchQuery` under the hook's own staleTime, never `ensureQueryData`.
// `ensureQueryData` returns cached data whatever its age — it only revalidates
// when asked, and a guard that never asks latches on the first session envelope
// the tab ever read. A session that then dies server-side stays signed in as far
// as every guard is concerned: `/` keeps redirecting to /characters, so the
// sign-in form cannot be reached again without a full page load. `fetchQuery`
// serves the cache inside the window and re-reads past it.
export async function resolveSession(
  queryClient: QueryClient,
): Promise<SessionResponse> {
  const envelope = (await queryClient.fetchQuery({
    ...getAuthControllerGetCurrentSessionQueryOptions(),
    staleTime: SESSION_STALE_TIME_MS,
  })) as authControllerGetCurrentSessionResponse;
  return envelope.data;
}
