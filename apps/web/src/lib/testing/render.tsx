import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';

import { createAppI18n } from '@/lib/i18n/init';

// Shared harness for component and hook specs: the i18n instance and a
// no-retry QueryClient, matching what main.tsx wires at the app root.
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
}

// A narrow, portable slice of RTL's RenderResult — enough for the specs, and it
// avoids leaking the transitive `pretty-format` type into the inferred return.
type RenderHandle = {
  container: HTMLElement;
  baseElement: HTMLElement;
  rerender: (ui: ReactElement) => void;
  unmount: () => void;
  i18n: I18nInstance;
  queryClient: QueryClient;
};

export function renderWithProviders(
  ui: ReactElement,
  options: { i18n?: I18nInstance; queryClient?: QueryClient } = {},
): RenderHandle {
  const i18n = options.i18n ?? createAppI18n();
  const queryClient = options.queryClient ?? makeQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </I18nextProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), i18n, queryClient };
}
