import { useServerMetaControllerGet } from '@/lib/api/generated/tormented-path';
import type { ServerMetaResponse } from '@/lib/api/generated/model';

// architecture-web.md rule 14 / stack-web.md rule 57: a documented endpoint gets
// Orval's generated hook, re-exported here with a `select` that unwraps the
// fetch client's `{ status, data, headers }` envelope so a component reads the
// response shape directly. The generated query key (URL-shaped, rule 20) is
// untouched.
export function useServerMeta() {
  return useServerMetaControllerGet<ServerMetaResponse>({
    query: {
      select: (envelope) => envelope.data,
    },
  });
}
