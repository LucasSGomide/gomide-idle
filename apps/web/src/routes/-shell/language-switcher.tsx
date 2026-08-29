import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  SUPPORTED_LANGUAGES,
  writeMirroredLanguage,
  type LanguageCode,
} from '@/lib/i18n/language';

// design.md §13: signed out, §1's top bar carries a standalone switcher because
// no account menu exists yet. The choice writes `localStorage` only
// (stack-web.md rule 53) and re-renders every string at once.
//
// design.md §9: a real <button> trigger carrying aria-expanded and
// aria-controls, a 2px accent focus ring at 2px offset on the trigger and every
// row, and a >=44px hit area padded out invisibly rather than by growing the
// visible control.
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const current = (i18n.resolvedLanguage ?? i18n.language) as LanguageCode;

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function choose(code: LanguageCode) {
    writeMirroredLanguage(code);
    void i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t('topBar.languageSwitcher.label')}
        onClick={() => setOpen((value) => !value)}
        className={
          'relative inline-flex items-center gap-2 rounded-sm px-3 py-2 ' +
          'text-sm font-medium text-text-primary transition-colors ' +
          'duration-fast ease-standard hover:bg-surface-hover ' +
          'before:absolute before:top-1/2 before:left-1/2 ' +
          'before:size-(--size-touch-target-min) before:-translate-x-1/2 ' +
          "before:-translate-y-1/2 before:content-[''] " +
          'focus-visible:outline-none focus-visible:ring-2 ' +
          'focus-visible:ring-accent focus-visible:ring-offset-2 ' +
          'focus-visible:ring-offset-bg'
        }
      >
        <span>{current.toUpperCase()}</span>
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className={
            'absolute right-0 z-10 mt-2 min-w-44 rounded-md border ' +
            'border-border-subtle bg-surface-elevated py-1'
          }
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <li key={language.code} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={language.code === current}
                onClick={() => choose(language.code)}
                className={
                  'flex w-full items-center gap-3 px-4 py-3 text-left ' +
                  'text-sm text-text-primary transition-colors duration-fast ' +
                  'ease-standard hover:bg-surface-hover ' +
                  'focus-visible:outline-none focus-visible:ring-2 ' +
                  'focus-visible:ring-accent focus-visible:ring-inset ' +
                  'aria-checked:font-semibold'
                }
              >
                <span aria-hidden="true" className="w-3 text-accent">
                  {language.code === current ? '•' : ''}
                </span>
                {language.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
