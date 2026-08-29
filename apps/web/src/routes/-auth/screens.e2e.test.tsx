/** @vitest-environment jsdom */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { mockServer } from '@/lib/api/mock-server';
import { createAppI18n } from '@/lib/i18n/init';
import { LANGUAGE_STORAGE_KEY } from '@/lib/i18n/language';
import { renderRoute } from '@/lib/testing/render-route';

type SessionBody = {
  user: { id: string; email: string } | null;
  registrationOpen: boolean;
};
const signedOut: SessionBody = { user: null, registrationOpen: true };
const signedIn: SessionBody = {
  user: { id: 'u1', email: 'ada@example.com' },
  registrationOpen: true,
};
const closed: SessionBody = { user: null, registrationOpen: false };

const sessionHandler = (body: SessionBody) =>
  http.get('*/auth/session', () => HttpResponse.json(body));

describe('the sign-in and sign-up screens (task 08/08)', () => {
  beforeEach(() => globalThis.localStorage.clear());

  // AC1
  it('sign-up with a valid e-mail and password calls the generated mutation and lands on /characters', async () => {
    const user = userEvent.setup();
    let sent: unknown;
    let session: SessionBody = signedOut;
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(session)),
      http.post('*/auth/sign-up', async ({ request }) => {
        sent = await request.json();
        session = signedIn;
        return HttpResponse.json(
          { user: { id: 'u9', email: 'new@example.com' } },
          { status: 201 },
        );
      }),
    );
    const { router } = renderRoute('/sign-up');

    await user.type(
      await screen.findByLabelText(/e-?mail/i),
      'new@example.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'a-good-long-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(sent).toEqual({
        email: 'new@example.com',
        password: 'a-good-long-password',
      }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/characters'),
    );
  });

  // AC2
  it('sign-in lands on the search param target when present and /characters otherwise', async () => {
    const user = userEvent.setup();
    let session: SessionBody = signedOut;
    mockServer.use(
      http.get('*/auth/session', () => HttpResponse.json(session)),
      http.post('*/auth/sign-in', () => {
        session = signedIn;
        return HttpResponse.json({
          user: { id: 'u1', email: 'ada@example.com' },
        });
      }),
    );
    const { router } = renderRoute('/?redirect=%2Fsign-up');

    await user.type(
      await screen.findByLabelText(/e-?mail/i),
      'ada@example.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'pw');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // target is /sign-up, which then bounces a signed-in player to /characters
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/characters'),
    );
  });

  // AC3
  it('/ and /sign-up both redirect to /characters when a session already exists', async () => {
    mockServer.use(sessionHandler(signedIn));
    const a = renderRoute('/');
    await waitFor(() =>
      expect(a.router.state.location.pathname).toBe('/characters'),
    );

    const b = renderRoute('/sign-up');
    await waitFor(() =>
      expect(b.router.state.location.pathname).toBe('/characters'),
    );
  });

  // AC4
  it('while a submit is in flight the button shows a spinner in place of its label and its width does not change', async () => {
    const user = userEvent.setup();
    let release: () => void = () => {};
    mockServer.use(
      sessionHandler(signedOut),
      http.post('*/auth/sign-in', async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ user: { id: 'u1', email: 'a@b.c' } });
      }),
    );
    renderRoute('/');

    await user.type(await screen.findByLabelText(/e-?mail/i), 'a@b.c');
    await user.type(screen.getByLabelText(/password/i), 'pw');
    const button = screen.getByRole('button', { name: 'Sign in' });
    const widthBefore = button.getBoundingClientRect().width;

    await user.click(button);

    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));
    // the label is still in the layout (invisible), the spinner overlays it
    expect(within(button).getByText('Sign in').className).toContain(
      'invisible',
    );
    expect(within(button).getByRole('status')).toBeInTheDocument();
    expect(button.getBoundingClientRect().width).toBe(widthBefore);
    release();
  });

  // AC5
  it('a field error puts danger on the border and renders helper text with its trailing icon', async () => {
    const user = userEvent.setup();
    mockServer.use(
      sessionHandler(signedOut),
      http.post('*/auth/sign-in', () =>
        HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          { status: 401 },
        ),
      ),
    );
    renderRoute('/');

    await user.type(
      await screen.findByLabelText(/e-?mail/i),
      'ada@example.com',
    );
    await user.type(screen.getByLabelText(/password/i), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const password = await screen.findByLabelText(/password/i);
    await waitFor(() =>
      expect(password).toHaveAttribute('aria-invalid', 'true'),
    );
    expect(password.className).toContain('border-danger');
    const help = document.getElementById(
      password.getAttribute('aria-describedby') as string,
    );
    expect(help).toHaveTextContent(/wrong e-?mail or password/i);
    expect(help?.className).toContain('text-danger');
    expect(help?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  // AC6
  it.each([
    ['INVALID_CREDENTIALS', 'sign-in', /wrong e-?mail or password/i, 401],
    ['EMAIL_TAKEN', 'sign-up', /already has an account/i, 409],
    ['TOO_MANY_ATTEMPTS', 'sign-in', /too many attempts/i, 429],
  ] as const)(
    '%s renders its catalogue string and never the server message',
    async (code, path, expected, status) => {
      const user = userEvent.setup();
      mockServer.use(
        sessionHandler(signedOut),
        http.post(`*/auth/${path}`, () =>
          HttpResponse.json(
            { code, message: 'RAW SERVER DETAIL 10.0.0.4' },
            { status },
          ),
        ),
      );
      renderRoute(path === 'sign-up' ? '/sign-up' : '/');

      await user.type(await screen.findByLabelText(/e-?mail/i), 'a@b.c');
      await user.type(
        screen.getByLabelText(/password/i),
        'a-good-long-password',
      );
      await user.click(
        screen.getByRole('button', {
          name: path === 'sign-up' ? 'Create account' : 'Sign in',
        }),
      );

      expect(await screen.findByText(expected)).toBeInTheDocument();
      expect(screen.queryByText(/RAW SERVER DETAIL/)).not.toBeInTheDocument();
    },
  );

  // AC7
  it('with registration closed, /sign-up renders the closed notice in place of the form and / drops the link', async () => {
    mockServer.use(sessionHandler(closed));

    const up = renderRoute('/sign-up');
    expect(
      await screen.findByRole('heading', { name: /sign-?ups? are closed/i }),
    ).toBeInTheDocument();
    expect(up.container.querySelector('input[type="email"]')).toBeNull();
    up.unmount();

    renderRoute('/');
    await screen.findByRole('heading', { name: 'Sign in' });
    expect(
      screen.queryByRole('link', { name: /create one/i }),
    ).not.toBeInTheDocument();
  });

  // AC10
  it('both forms render their Portuguese strings without truncation', async () => {
    globalThis.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt');
    mockServer.use(sessionHandler(signedOut));

    const inScreen = renderRoute('/', { i18n: createAppI18n() });
    expect(
      await screen.findByRole('button', { name: 'Entrar' }),
    ).toBeInTheDocument();
    expect(inScreen.container.querySelector('.truncate')).toBeNull();
    inScreen.unmount();

    const upScreen = renderRoute('/sign-up', { i18n: createAppI18n() });
    expect(
      await screen.findByRole('button', { name: 'Criar conta' }),
    ).toBeInTheDocument();
    expect(upScreen.container.querySelector('.truncate')).toBeNull();
  });
});
