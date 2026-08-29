import type { QueryClient } from '@tanstack/react-query';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import { useProtocolGuard } from '@/transport/protocol-guard';

import { ErrorBoundary } from './-shell/error-boundary';
import { OutOfDateScreen } from './-shell/out-of-date-screen';
import { RootErrorComponent, Shell } from './-shell/root-error';

// stack-web.md rules 3, 38-39: file-based routes, the tree generated into
// routeTree.gen.ts. rule 40: the QueryClient rides in the router context so a
// loader can prefetch through the same cache a hook reads.
export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RootErrorComponent,
});

function RootLayout() {
  const protocol = useProtocolGuard();

  // stack-web.md rule 22: a protocol mismatch replaces the page entirely — the
  // top bar and the footer go with it.
  if (protocol === 'mismatch') {
    return <OutOfDateScreen />;
  }

  return (
    <Shell>
      {/* architecture-web.md rule 23: the per-route boundary. A route subtree
          throwing renders the block in place of this region alone — the top bar
          and the footer sit outside it and stay on screen. */}
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </Shell>
  );
}
