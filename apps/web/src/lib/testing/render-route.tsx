import { QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';

import { createAppI18n } from '@/lib/i18n/init';
import {
  ProtocolCheckerProvider,
  type ProtocolCheckResult,
} from '@/transport/protocol-guard';

import { makeQueryClient } from './render';
import { routeTree } from '@/routeTree.gen';

// A narrow slice of the RTL result plus the router — enough for the specs, and
// annotating it keeps the inferred `pretty-format` type from leaking (as
// render.tsx does).
type RouteHandle = {
  container: HTMLElement;
  baseElement: HTMLElement;
  unmount: () => void;
  i18n: I18nInstance;
  router: {
    state: {
      location: { pathname: string; search: Record<string, unknown> };
    };
  };
};

// Boots the real route tree over a memory history — the harness the shell's
// e2e specs use. The protocol checker defaults to one that never resolves, so
// the live socket handshake (which MSW cannot intercept) is never opened; a
// mismatch spec passes its own checker.
export function renderRoute(
  path = '/',
  options: {
    i18n?: I18nInstance;
    protocolChecker?: () => Promise<ProtocolCheckResult>;
  } = {},
): RouteHandle {
  const i18n = options.i18n ?? createAppI18n();
  const queryClient = makeQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  const checker =
    options.protocolChecker ??
    (() => new Promise<ProtocolCheckResult>(() => {}));

  const result = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ProtocolCheckerProvider checker={checker}>
          <RouterProvider router={router} />
        </ProtocolCheckerProvider>
      </QueryClientProvider>
    </I18nextProvider>,
  );

  return {
    container: result.container,
    baseElement: result.baseElement,
    unmount: result.unmount,
    i18n,
    router: router as unknown as RouteHandle['router'],
  };
}
