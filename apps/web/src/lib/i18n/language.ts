// stack-web.md rules 52-53: there is no account yet, so the signed-out switcher
// writes the chosen language to `localStorage` alone. The shell reads it back
// synchronously at startup — that read is the only reason a returning
// Portuguese player does not see one English frame.

export const LANGUAGE_STORAGE_KEY = 'tormented-path.language';

// design.md §13: each language is named in its own language, never translated
// into the current one — a player who cannot read the current language is
// exactly the one opening the switcher.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'pt', name: 'Português' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

function isSupported(value: string | null): value is LanguageCode {
  return SUPPORTED_LANGUAGES.some((language) => language.code === value);
}

/**
 * Reads the mirrored language synchronously. Falls back to English when
 * `localStorage` holds nothing, holds an unknown value, or is unavailable.
 */
export function readMirroredLanguage(): LanguageCode {
  try {
    const stored =
      globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
    return isSupported(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * The single writer the switcher calls. Stores the choice in `localStorage` and
 * issues no network call — there is no account to carry it to yet.
 */
export function writeMirroredLanguage(code: LanguageCode): void {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    // A private-mode or blocked `localStorage` is not worth failing a click
    // over; the choice is simply not remembered across reloads.
  }
}
