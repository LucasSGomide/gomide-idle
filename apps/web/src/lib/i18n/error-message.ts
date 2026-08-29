import type { TFunction } from 'i18next';

import { en } from './en';

// architecture-web.md rule 27 / FR.13.3: the web renders an error from its
// `code` through the catalogue, never from the server's `message`. An
// unrecognised code renders the generic entry rather than the raw code
// (architecture-web.md rule 32's reasoning, applied to errors).

export type ErrorCode = keyof (typeof en)['errors'];

export function isKnownErrorCode(code: string): code is ErrorCode {
  return code in en.errors;
}

export function resolveErrorMessage(
  t: TFunction<'translation'>,
  code: string,
): string {
  return isKnownErrorCode(code) ? t(`errors.${code}`) : t('errors.GENERIC');
}
