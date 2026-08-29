/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAppI18n } from '@/lib/i18n/init';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language';
import { renderWithProviders } from '@/lib/testing/render';

import { OutOfDateScreen } from './out-of-date-screen';

describe('the out-of-date screen', () => {
  beforeEach(() => globalThis.localStorage.clear());

  // wireframe 07: a headline, an instruction and a single Reload button.
  it('renders the refusal message and a Reload control', () => {
    renderWithProviders(<OutOfDateScreen />);
    expect(
      screen.getByRole('heading', { name: 'Your client is out of date.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reload the page to continue.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  // wireframe 07: it renders through the catalogue in the mirrored language.
  it('renders in Portuguese under a Portuguese mirror, without truncation', () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    const { container } = renderWithProviders(<OutOfDateScreen />, {
      i18n: createAppI18n(),
    });
    expect(
      screen.getByRole('heading', { name: 'Seu cliente está desatualizado.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Recarregue a página para continuar.'),
    ).toBeInTheDocument();
    expect(container.querySelector('.truncate')).toBeNull();
  });
});
