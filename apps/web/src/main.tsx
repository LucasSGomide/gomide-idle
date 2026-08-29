import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';

import { createAppI18n } from './lib/i18n/init';
import { routeTree } from './routeTree.gen';
import './lib/styles/app.css';

// stack-web.md rule 40: the QueryClient is handed to the router so a loader can
// prefetch through the same cache a component's hook will read.
const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// stack-web.md rule 52: the mirrored language is read synchronously here, before
// the first render, so a returning Portuguese player never sees an English frame.
const i18n = createAppI18n();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('#root is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
);
