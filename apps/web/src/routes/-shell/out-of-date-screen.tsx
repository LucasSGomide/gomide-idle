import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button';

// stack-web.md rule 22 / wireframe 07: a protocol mismatch replaces the whole
// page — the top bar and the footer go with it. It is a refusal, not a degraded
// mode, so there is nothing left on screen to interact with but Reload.
//
// design.md §2: the headline at `2xl` Rajdhani 600 as a screen sub-heading, the
// instruction at `base` Inter 400. It renders in the mirrored language, since
// the player never reached an account.
export function OutOfDateScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-8 text-center">
      <h1 className="font-display text-2xl font-semibold text-text-primary">
        {t('outOfDate.title')}
      </h1>
      <p className="text-base text-text-secondary">{t('outOfDate.body')}</p>
      <Button onClick={() => globalThis.location.reload()}>
        {t('outOfDate.reload')}
      </Button>
    </div>
  );
}
