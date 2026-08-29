import type { TFunction } from 'i18next';

import type { en } from './en';

// stack-web.md rule 49 / FR.16.4: the typed catalogue turns react-i18next's
// runtime miss back into a compile error. `tsc --noEmit` (the typecheck script)
// enforces every `@ts-expect-error` below — an unused one is itself an error.

declare const t: TFunction<'translation'>;

// A known key resolves to `string` (returnNull: false), never `string | null`.
const knownKey: string = t('errorBoundary.reload');
const interpolatedKey: string = t('footer.protocol', { version: 3 });
void knownKey;
void interpolatedKey;

// @ts-expect-error — an unknown key is not in CustomTypeOptions['resources'].
t('errorBoundary.does_not_exist');

// The Portuguese catalogue must cover every English key: a catalogue missing one
// does not satisfy `typeof en`.
// @ts-expect-error — topBar, footer, errors, session and outOfDate are absent.
const incompletePortuguese: typeof en = {
  errorBoundary: { title: 'x', reload: 'y' },
};
void incompletePortuguese;
