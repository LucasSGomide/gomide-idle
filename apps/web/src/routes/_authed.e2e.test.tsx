/** @vitest-environment jsdom */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, delay, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { createAppI18n } from '@/lib/i18n/init';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language';
import { renderRoute } from '@/lib/testing/render-route';

const signedIn = {
  user: { id: 'u1', email: 'ada@example.com' },
  registrationOpen: true,
};
const signedOut = { user: null, registrationOpen: true };

describe('the _authed guard and the characters shell (task 07/07)', () => {
  beforeEach(() => globalThis.localStorage.clear());

  // AC1
  it('redirects a session-less visit to / with the attempted path in a search param', async () => {
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(signedOut)),
    );
    const { router } = renderRoute('/characters');

    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(router.state.location.search).toMatchObject({
      redirect: '/characters',
    });
  });

  // AC2
  it('renders /characters as the signed-in top bar over an empty body when a session exists', async () => {
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(signedIn)),
    );
    renderRoute('/characters');

    expect(
      await screen.findByRole('button', { name: /account/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /change language/i }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('main')).toBeEmptyDOMElement());
  });

  // AC3
  it('shows the loading state while the session is in flight and never the signed-out shell', async () => {
    mockServer.use(
      http.get('*/auth/session', async () => {
        await delay(80);
        return HttpResponse.json(signedIn);
      }),
    );
    renderRoute('/characters');

    expect(await screen.findByRole('status')).toBeInTheDocument();
    // the signed-out standalone switcher never appears
    expect(
      screen.queryByRole('button', { name: /change language/i }),
    ).not.toBeInTheDocument();
    await screen.findByRole('button', { name: /account/i });
  });

  // AC4
  it('renders a failed session request from its catalogue code, never the server message', async () => {
    mockServer.use(
      http.get('*/auth/session', () =>
        HttpResponse.json(
          {
            statusCode: 500,
            code: 'INTERNAL_ERROR',
            message: 'pg down at 10.0.0.4',
          },
          { status: 500 },
        ),
      ),
    );
    renderRoute('/characters');

    expect(
      await screen.findByText(/version details are unavailable/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pg down/i)).not.toBeInTheDocument();
  });

  // AC5
  it('the account menu holds the language switcher and sign-out, and switching writes localStorage and re-renders', async () => {
    const user = userEvent.setup();
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(signedIn)),
      http.post('*/auth/sign-out', () => HttpResponse.json({ success: true })),
    );
    renderRoute('/characters', { i18n: createAppI18n() });

    await user.click(await screen.findByRole('button', { name: /account/i }));
    const menu = screen.getByRole('menu');
    expect(
      within(menu).getByRole('menuitemradio', { name: 'English' }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole('menuitem', { name: /sign out/i }),
    ).toBeInTheDocument();

    await user.click(
      within(menu).getByRole('menuitemradio', { name: 'Português' }),
    );
    expect(globalThis.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt');
    expect(
      await screen.findByRole('button', { name: 'Conta' }),
    ).toBeInTheDocument();
  });

  // AC6
  it('sign-out calls the generated mutation and lands on /', async () => {
    const user = userEvent.setup();
    let hit = false;
    let current = signedIn as { user: unknown; registrationOpen: boolean };
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(current)),
      http.post('*/auth/sign-out', () => {
        hit = true;
        current = signedOut;
        return HttpResponse.json({ success: true });
      }),
    );
    const { router } = renderRoute('/characters');

    await user.click(await screen.findByRole('button', { name: /account/i }));
    await user.click(screen.getByRole('menuitem', { name: /sign out/i }));

    await waitFor(() => expect(hit).toBe(true));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  // AC7
  it('renders the signed-in top bar Portuguese strings without truncation', async () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    const user = userEvent.setup();
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(signedIn)),
    );
    const { container } = renderRoute('/characters', { i18n: createAppI18n() });

    await user.click(await screen.findByRole('button', { name: 'Conta' }));
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemradio', { name: 'Português' }),
    ).toBeInTheDocument();
    expect(container.querySelector('.truncate')).toBeNull();
  });
});
