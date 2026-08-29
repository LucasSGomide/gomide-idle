import { useTranslation } from 'react-i18next';

import { useServerMeta } from '@/features/server-meta/use-server-meta';
import { errorCode } from '@/lib/api/fetcher';
import { resolveErrorMessage } from '@/lib/i18n/error-message';

// roadmap 02 / wireframe 06: a persistent footer carrying UN.10's three values —
// the protocol integer, the content-pack version and the build id — fetched by
// the generated hook after the shell is already on screen. A New pattern:
// design.md describes no footer, so its shape is decided here — pinned to the
// bottom of the shell, 32px tall (`h-8`), §1's 32px page margins (`px-8`), text
// at `xs` Inter 400 in `textSecondary`, values separated by `space-4`.
//
// architecture-web.md rule 32: no content-pack version check runs here. The
// value is displayed, never compared.
export function Footer() {
  const { t } = useTranslation();
  const query = useServerMeta();

  // States — pending: no line and no spinner. The shell is the page.
  if (query.isPending) {
    return null;
  }

  return (
    <footer
      className={
        'mx-auto flex min-h-8 w-full max-w-[90rem] shrink-0 flex-wrap ' +
        'items-center gap-4 px-8 text-xs'
      }
    >
      {query.isError ? (
        // States — error: the catalogue entry for the error's `code`, never the
        // server's `message`.
        <span className="text-danger">
          {resolveErrorMessage(t, errorCode(query.error))}
        </span>
      ) : (
        <>
          <span className="text-text-secondary">
            {t('footer.protocol', {
              version: query.data.socketProtocolVersion,
            })}
          </span>
          <span className="text-text-secondary">
            {t('footer.contentPack', {
              version: query.data.contentPackVersion,
            })}
          </span>
          <span className="text-text-secondary">
            {t('footer.build', { id: query.data.buildId })}
          </span>
        </>
      )}
    </footer>
  );
}
