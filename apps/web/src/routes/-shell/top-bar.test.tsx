/** @vitest-environment jsdom */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVE_SEASON, GAME_NAME } from '@/lib/brand';
import { createAppI18n } from '@/lib/i18n/init';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language';
import { renderWithProviders } from '@/lib/testing/render';

import { TopBar } from './top-bar';

describe('the signed-out top bar', () => {
  beforeEach(() => globalThis.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  // wireframe 04 / FR.16.2: 56px tall, wordmark left, standalone switcher right.
  it('is 56px tall with the wordmark left and the switcher right', () => {
    renderWithProviders(<TopBar />);
    const bar = screen.getByRole('banner');
    // h-14 is Tailwind's 3.5rem === 56px.
    expect(bar.className).toContain('h-14');

    const wordmark = screen.getByText(GAME_NAME).parentElement!;
    const trigger = screen.getByRole('button', { name: /change language/i });
    expect(bar).toContainElement(wordmark);
    expect(bar).toContainElement(trigger);
    // DOM order: wordmark before the switcher.
    expect(
      wordmark.compareDocumentPosition(trigger) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  // wireframe 04: one line — GAME_NAME bold, ": ", ACTIVE_SEASON italic — both
  // from the brand module.
  it('renders the wordmark as name-bold, ": ", season-italic on one line', () => {
    renderWithProviders(<TopBar />);
    const name = screen.getByText(GAME_NAME);
    const season = screen.getByText(ACTIVE_SEASON);
    expect(name.className).toContain('font-bold');
    expect(season.className).toContain('italic');
    const line = name.parentElement!;
    expect(line.className).toContain('whitespace-nowrap');
    expect(line).toHaveTextContent(`${GAME_NAME}: ${ACTIVE_SEASON}`);
  });

  // wireframe 04: the wordmark and season are proper nouns — identical under a
  // Portuguese mirror, never translation keys.
  it('renders the wordmark identically under a Portuguese mirror', () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    renderWithProviders(<TopBar />, { i18n: createAppI18n() });
    expect(screen.getByText(GAME_NAME).parentElement).toHaveTextContent(
      `${GAME_NAME}: ${ACTIVE_SEASON}`,
    );
  });

  // design.md §9: a real <button> trigger carrying aria-expanded / aria-controls.
  it('exposes the switcher trigger with aria-expanded and aria-controls', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopBar />);
    const trigger = screen.getByRole('button', { name: /change language/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = screen.getByRole('menu');
    expect(menu.id).toBe(trigger.getAttribute('aria-controls'));
    expect(
      within(menu).getByRole('menuitemradio', { name: 'English' }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitemradio', { name: 'Português' }),
    ).toBeInTheDocument();
  });

  // wireframe 04: choosing writes localStorage and nothing else, and re-renders
  // every string in the bar at once.
  it('writes only localStorage and re-renders the bar on switch to Portuguese', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}'));

    const { i18n } = renderWithProviders(<TopBar />, { i18n: createAppI18n() });
    await user.click(screen.getByRole('button', { name: /change language/i }));
    await act(async () => {
      await user.click(
        screen.getByRole('menuitemradio', { name: 'Português' }),
      );
    });

    await waitFor(() => expect(i18n.language).toBe('pt'));
    expect(globalThis.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt');
    expect(fetchSpy).not.toHaveBeenCalled();
    // The switcher's own accessible name is now Portuguese.
    expect(
      screen.getByRole('button', { name: 'Alterar idioma' }),
    ).toBeInTheDocument();
  });

  // wireframe 04 / §13: nothing truncates.
  it('never truncates its strings', () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    const { container } = renderWithProviders(<TopBar />, {
      i18n: createAppI18n(),
    });
    expect(container.querySelector('.truncate')).toBeNull();
  });
});
