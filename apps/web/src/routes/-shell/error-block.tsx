import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/ui/button';

// design.md §8 / wireframe 06: the block a boundary renders in place of a
// failed region — a `danger` panel at `space-5` all round with `radius.md`, a
// short line stating what is wrong, and a single Reload button, because here an
// action resolves it. §9: focus moves into the block when it replaces the
// region.
//
// `fullWidth` is the only difference between the route boundary and the
// application-root one — how much of the page the block occupies, never what it
// says (there is no second catalogue entry).
export function ErrorBlock({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className={
        'rounded-md border border-danger bg-danger-bg p-5 ' +
        'focus-visible:outline-none focus-visible:ring-2 ' +
        'focus-visible:ring-accent focus-visible:ring-offset-2 ' +
        'focus-visible:ring-offset-bg ' +
        (fullWidth ? 'w-full' : 'max-w-xl')
      }
    >
      <p className="text-sm text-text-primary">{t('errorBoundary.title')}</p>
      <div className="mt-4">
        <Button onClick={() => globalThis.location.reload()}>
          {t('errorBoundary.reload')}
        </Button>
      </div>
    </div>
  );
}
