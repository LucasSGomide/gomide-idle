/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/lib/testing/render';

import { ErrorBlock } from './error-block';
import { ErrorBoundary } from './error-boundary';
import { RootErrorComponent } from './root-error';

function Boom(): never {
  throw new Error('kaboom');
}

describe('the route error boundary', () => {
  beforeEach(() => {
    // React logs the caught error; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  // wireframe 06: a component throwing under a route renders the block in place
  // of that region alone — siblings outside the boundary keep rendering.
  it('renders the block in place of the throwing region, leaving siblings alone', () => {
    renderWithProviders(
      <div>
        <span>top bar</span>
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
        <span>footer</span>
      </div>,
    );

    expect(
      screen.getByText('This section could not be loaded.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.getByText('top bar')).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });

  it('scopes the block to its region by default and only goes full-width when asked', () => {
    const { rerender } = renderWithProviders(<ErrorBlock />);
    expect(screen.getByRole('alert').className).toContain('max-w-xl');
    expect(screen.getByRole('alert').className).not.toContain('w-full');

    rerender(<ErrorBlock fullWidth />);
    expect(screen.getByRole('alert').className).toContain('w-full');
  });

  // wireframe 06: the application-root case renders the same block full-width
  // with the top bar still drawn — no blank page.
  it('draws the top bar and a full-width block for an application-root error', () => {
    renderWithProviders(<RootErrorComponent />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('alert').className).toContain('w-full');
    expect(
      screen.getByText('This section could not be loaded.'),
    ).toBeInTheDocument();
  });
});
