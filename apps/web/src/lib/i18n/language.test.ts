/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  readMirroredLanguage,
  writeMirroredLanguage,
} from './language';

describe('the localStorage language mirror', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // stack-web.md rule 52: read synchronously at startup, before the first render.
  it('reads the mirrored language synchronously', () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    expect(readMirroredLanguage()).toBe('pt');
  });

  it('falls back to English when localStorage holds nothing', () => {
    expect(readMirroredLanguage()).toBe(DEFAULT_LANGUAGE);
    expect(DEFAULT_LANGUAGE).toBe('en');
  });

  it('falls back to English when localStorage holds an unknown value', () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'de');
    expect(readMirroredLanguage()).toBe('en');
  });

  // stack-web.md rule 53: the writer stores the choice and issues no network
  // call — there is no account to carry it to yet.
  it('stores the chosen language and makes no network call', () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}'));

    writeMirroredLanguage('pt');

    expect(globalThis.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
