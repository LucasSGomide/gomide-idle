/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { screen } from '@testing-library/react';
import { HttpResponse, http, delay } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { createAppI18n } from '@/lib/i18n/init';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language';
import { renderWithProviders } from '@/lib/testing/render';

import { Footer } from './footer';

const here = dirname(fileURLToPath(import.meta.url));

describe('the footer', () => {
  beforeEach(() => globalThis.localStorage.clear());

  // wireframe 06: pending — no line and no spinner. The shell is the page.
  it('renders nothing while the query is pending', async () => {
    mockServer.use(
      http.get('*/server-meta', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const { container } = renderWithProviders(<Footer />);
    // Give the query a tick to enter flight.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // wireframe 06 / FR.10.1: the three values from the generated hook.
  it('renders the protocol, content-pack and build values', async () => {
    mockServer.use(
      http.get('*/server-meta', () =>
        HttpResponse.json({
          socketProtocolVersion: 3,
          contentPackVersion: '2026.08.1',
          buildId: 'a9ac2c2',
        }),
      ),
    );
    renderWithProviders(<Footer />);
    expect(await screen.findByText('protocol 3')).toBeInTheDocument();
    expect(screen.getByText('content-pack 2026.08.1')).toBeInTheDocument();
    expect(screen.getByText('build a9ac2c2')).toBeInTheDocument();
  });

  // wireframe 06 / FR.13.3: an error renders the catalogue entry for its `code`;
  // the server's `message` appears nowhere in the document.
  it('renders the catalogue entry for the error code, never the server message', async () => {
    mockServer.use(
      http.get('*/server-meta', () =>
        HttpResponse.json(
          {
            statusCode: 500,
            code: 'INTERNAL_ERROR',
            message: 'pg: connection refused at 10.0.0.4:5432',
          },
          { status: 500 },
        ),
      ),
    );
    renderWithProviders(<Footer />);
    expect(
      await screen.findByText(
        'Version details are unavailable. Reload to try again.',
      ),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('connection refused');
  });

  // wireframe 06: an unrecognised code renders a generic entry, not the raw code.
  it('renders a generic entry for an unrecognised error code', async () => {
    mockServer.use(
      http.get('*/server-meta', () =>
        HttpResponse.json(
          { statusCode: 503, code: 'DATABASE_ASLEEP', message: 'zzz' },
          { status: 503 },
        ),
      ),
    );
    renderWithProviders(<Footer />);
    expect(
      await screen.findByText('Something went wrong. Reload to try again.'),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('DATABASE_ASLEEP');
  });

  // wireframe 06 / §13: nothing truncates in Portuguese.
  it('does not truncate its Portuguese strings', async () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    mockServer.use(
      http.get('*/server-meta', () =>
        HttpResponse.json({
          socketProtocolVersion: 3,
          contentPackVersion: '2026.08.1',
          buildId: 'a9ac2c2',
        }),
      ),
    );
    const { container } = renderWithProviders(<Footer />, {
      i18n: createAppI18n(),
    });
    await screen.findByText(/protocolo 3/);
    expect(container.querySelector('.truncate')).toBeNull();
  });

  // architecture-web.md rule 32: no content-pack version check runs on this path.
  it('never compares the content-pack version', () => {
    const source = readFileSync(join(here, 'footer.tsx'), 'utf8');
    expect(source).not.toMatch(/contentPackVersion\s*[=!]==/);
    expect(source).not.toMatch(/(satisfies|expected|check).*content.?pack/i);
  });
});
