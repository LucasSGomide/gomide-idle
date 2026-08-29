/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { ACTIVE_SEASON, GAME_NAME } from '@/lib/brand';
import { createAppI18n } from '@/lib/i18n/init';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language';
import { renderRoute } from '@/lib/testing/render-route';
import { SOCKET_PROTOCOL_VERSION } from '@/lib/protocol';

import { mockServer } from '@/lib/api/mock-server';

describe('the shell at /', () => {
  beforeEach(() => globalThis.localStorage.clear());

  // wireframe 04 / FR.16.2: loading / renders the top bar over an empty body.
  it('renders the top bar over an empty body', async () => {
    renderRoute('/');
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(screen.getByText(GAME_NAME).parentElement).toHaveTextContent(
      `${GAME_NAME}: ${ACTIVE_SEASON}`,
    );
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });

  // wireframe 04: a load with Portuguese mirrored paints the bar in Portuguese,
  // with no English frame first.
  it('paints the bar in Portuguese from a Portuguese mirror, with no English frame', async () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    renderRoute('/', { i18n: createAppI18n() });
    expect(
      await screen.findByRole('button', { name: 'Alterar idioma' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Change language' }),
    ).not.toBeInTheDocument();
  });

  // wireframe 06 / FR.10.1: the footer renders the three values fetched by the
  // generated hook, after the shell is on screen.
  it('renders the protocol, content-pack and build values from the generated hook', async () => {
    mockServer.use(
      http.get('*/server-meta', () =>
        HttpResponse.json({
          socketProtocolVersion: 7,
          contentPackVersion: '2099.12.9',
          buildId: 'deadbeef',
        }),
      ),
    );
    renderRoute('/');
    expect(await screen.findByText('protocol 7')).toBeInTheDocument();
    expect(screen.getByText('content-pack 2099.12.9')).toBeInTheDocument();
    expect(screen.getByText('build deadbeef')).toBeInTheDocument();
  });

  // wireframe 07: a matching protocol leaves the shell rendered and shows
  // nothing extra.
  it('leaves the shell untouched on a matching protocol', async () => {
    renderRoute('/', {
      protocolChecker: async () => ({ status: 'ok' as const }),
    });
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(screen.queryByText(/out of date/i)).not.toBeInTheDocument();
  });

  // wireframe 07 / FR.10.3: a mismatched protocol replaces the whole page with
  // the full-screen out-of-date message; the bar and footer go with it.
  it('replaces the page with the out-of-date screen on a protocol mismatch', async () => {
    renderRoute('/', {
      protocolChecker: async () => ({
        status: 'mismatch' as const,
        serverProtocol: SOCKET_PROTOCOL_VERSION + 1,
      }),
    });
    expect(
      await screen.findByText('Your client is out of date.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });
});
