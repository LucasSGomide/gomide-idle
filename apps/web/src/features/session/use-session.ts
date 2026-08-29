import { useAuthControllerGetCurrentSession } from '@/lib/api/generated/tormented-path';
import type { SessionResponse } from '@/lib/api/generated/model';

// auth.md rules 4, 23 / architecture-web.md rule 33: features/session/ is the
// only consumer of the generated auth hooks, and only routes/ and this feature
// read the session. Built over the generated query hook — never Better Auth's
// own useSession (auth.md rule 23).
//
// The `select` unwraps the fetch mutator's `{ status, data, headers }` envelope
// so a caller reads `{ user, registrationOpen }` directly; the generated,
// URL-shaped query key is untouched (stack-web.md rule 57).
// The window the guards share (require-session.ts). Inside it a burst of
// navigations reads the cache; past it the next guard re-reads, so a session
// that dies while the tab is open still becomes visible without a page reload.
export const SESSION_STALE_TIME_MS = 30_000;

export function useSession() {
  return useAuthControllerGetCurrentSession<SessionResponse>({
    query: {
      select: (envelope) => envelope.data,
      // A 401 is handled once in the fetch mutator (task 08); re-fetching here
      // on window focus would just replay it.
      staleTime: SESSION_STALE_TIME_MS,
    },
  });
}
