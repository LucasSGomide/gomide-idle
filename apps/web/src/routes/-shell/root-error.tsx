import type { ReactNode } from 'react';

import { ErrorBlock } from './error-block';
import { Footer } from './footer';
import { TopBar } from './top-bar';

// The shell chrome shared by the normal layout and both error views, so a
// broken screen keeps the top bar and the footer (architecture-web.md rule 23).
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopBar />
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-8 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// architecture-web.md rule 23's application-root case: the same block full-width,
// with the top bar still drawn — no second layout, no second catalogue entry.
export function RootErrorComponent() {
  return (
    <Shell>
      <ErrorBlock fullWidth />
    </Shell>
  );
}
