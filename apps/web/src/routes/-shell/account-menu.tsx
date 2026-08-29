import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useSignOut } from '@/features/session/use-sign-out';
import { writeMirroredLanguage, type LanguageCode } from '@/lib/i18n/language';

import { LanguageMenuItems } from './language-menu-items';
import { useMenuToggle } from './use-menu-toggle';

// design.md §1 Character-select row / §13: signed in, the language switcher is
// an item in this account menu, because the active language lives on the account
// (stack-web.md rule 52). Until Language and localisation adds player_account,
// choosing still writes `localStorage` alone — exactly as the signed-out
// switcher does; nothing here is rewritten.
//
// wireframe 07: radius.md menu, rows space-3/space-4, each row's hit area 44px,
// Sign out below a divider because it is the only destructive thing. §11: the
// label is verb-first and specific.
export function AccountMenu() {
  const { t, i18n } = useTranslation();
  const { open, setOpen, containerRef } = useMenuToggle();
  const menuId = useId();
  const current = (i18n.resolvedLanguage ?? i18n.language) as LanguageCode;
  const { signOut } = useSignOut();

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
        <span>{t('topBar.account')}</span>
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
          <LanguageMenuItems current={current} onChoose={choose} />
          <li role="none" className="my-1 border-t border-border-subtle" />
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className={
                'relative flex w-full items-center px-4 py-3 text-left ' +
                'text-sm text-text-primary transition-colors duration-fast ' +
                'ease-standard hover:bg-surface-hover ' +
                'before:absolute before:top-1/2 before:left-0 before:h-11 ' +
                'before:w-full before:-translate-y-1/2 before:content-[""] ' +
                'focus-visible:outline-none focus-visible:ring-2 ' +
                'focus-visible:ring-accent focus-visible:ring-inset'
              }
            >
              {t('topBar.signOut')}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
