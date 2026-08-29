import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/i18n/language';

// design.md §13: the language rows, shared by the signed-out standalone switcher
// and the signed-in account menu. Each language is named in its own language and
// never translated into the current one; choosing writes `localStorage` only
// (the caller's `onChoose`). §5 ghost controls, §4 44px hit area padded
// invisibly, §9 a 2px accent ring focus-visible.
export function LanguageMenuItems({
  current,
  onChoose,
}: {
  current: LanguageCode;
  onChoose: (code: LanguageCode) => void;
}) {
  return (
    <>
      {SUPPORTED_LANGUAGES.map((language) => (
        <li key={language.code} role="none">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={language.code === current}
            onClick={() => onChoose(language.code)}
            className={
              'relative flex w-full items-center gap-3 px-4 py-3 text-left ' +
              'text-sm text-text-primary transition-colors duration-fast ' +
              'ease-standard hover:bg-surface-hover ' +
              'before:absolute before:top-1/2 before:left-0 before:h-11 ' +
              'before:w-full before:-translate-y-1/2 before:content-[""] ' +
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
    </>
  );
}
