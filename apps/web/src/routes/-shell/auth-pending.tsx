import { useTranslation } from 'react-i18next';

// wireframe 07 (_authed resolving): design.md §7 puts a spinner here, not a
// skeleton — until the session answers, the shape of what follows is unknown.
// §9: an aria-live="polite" region so the outcome is announced rather than
// silently swapped in. §7 reduced motion: the animation is `motion-safe` only.
export function AuthPending() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-40 items-center justify-center"
    >
      <span
        aria-hidden="true"
        className={
          'size-6 rounded-full border-2 border-border-strong ' +
          'border-t-accent motion-safe:animate-spin'
        }
      />
      <span className="sr-only">{t('session.loading')}</span>
    </div>
  );
}
