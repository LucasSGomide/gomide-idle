import { useTranslation } from 'react-i18next';

import { errorCode } from '@/lib/api/fetcher';
import { resolveErrorMessage } from '@/lib/i18n/error-message';

// architecture-web.md rule 27 / wireframe 07: a session request that fails
// renders from its `code` through the catalogue, never the server's `message`.
// design.md §8/§11: the failure reads in `danger`, what went wrong then what to
// do, from the catalogue entry for the code.
export function AuthError({ error }: { error: unknown }) {
  const { t } = useTranslation();
  return (
    <p role="alert" className="text-sm text-danger">
      {resolveErrorMessage(t, errorCode(error))}
    </p>
  );
}
