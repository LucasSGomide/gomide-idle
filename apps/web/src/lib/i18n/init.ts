import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en';
import { readMirroredLanguage } from './language';
import { pt } from './pt';

// stack-web.md rules 48-52: react-i18next 17 / i18next 26, English and
// Portuguese from the first screen, `returnNull: false` so `t()` is typed
// `string` at every call site, and the starting language read synchronously
// from the `localStorage` mirror before the first render.

export const resources = {
  en: { translation: en },
  pt: { translation: pt },
} as const;

export function createAppI18n(): I18nInstance {
  const instance = i18next.createInstance();

  void instance.use(initReactI18next).init({
    resources,
    lng: readMirroredLanguage(),
    fallbackLng: 'en',
    defaultNS: 'translation',
    returnNull: false,
    interpolation: { escapeValue: false },
  });

  return instance;
}
