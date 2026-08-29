/** @vitest-environment jsdom */
import { render, screen, act } from '@testing-library/react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAppI18n } from './init';
import { LANGUAGE_STORAGE_KEY } from './language';

describe('the app i18n instance', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  // stack-web.md rule 52: the starting language is the mirror, read before the
  // first render — a returning Portuguese player never sees an English frame.
  it('starts in the language mirrored in localStorage', () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    const i18n = createAppI18n();
    expect(i18n.language).toBe('pt');
  });

  it('starts in English when nothing is mirrored', () => {
    expect(createAppI18n().language).toBe('en');
  });

  // stack-web.md rule 48: returnNull:false makes t() a string at every call site.
  it('returns a string and never null, with returnNull:false in force', () => {
    const i18n = createAppI18n();
    expect(i18n.options.returnNull).toBe(false);
    expect(typeof i18n.t('errorBoundary.reload')).toBe('string');
    // A runtime miss still returns a string (the key), never null. The key is
    // cast because the typed catalogue (rule 49) makes an unknown key a compile
    // error — which is the point.
    const miss = i18n.t(
      'errorBoundary.does_not_exist' as 'errorBoundary.reload',
    );
    expect(typeof miss).toBe('string');
  });

  // wireframe 04: switching language re-renders every mounted string at once.
  it('re-renders every mounted string on a language change', async () => {
    const i18n = createAppI18n();

    function Probe() {
      const { t } = useTranslation();
      return (
        <>
          <span data-testid="a">{t('errorBoundary.reload')}</span>
          <span data-testid="b">{t('outOfDate.title')}</span>
        </>
      );
    }

    render(
      <I18nextProvider i18n={i18n}>
        <Probe />
      </I18nextProvider>,
    );

    expect(screen.getByTestId('a')).toHaveTextContent('Reload');
    expect(screen.getByTestId('b')).toHaveTextContent(
      'Your client is out of date.',
    );

    await act(async () => {
      await i18n.changeLanguage('pt');
    });

    expect(screen.getByTestId('a')).toHaveTextContent('Recarregar');
    expect(screen.getByTestId('b')).toHaveTextContent(
      'Seu cliente está desatualizado.',
    );
  });
});
