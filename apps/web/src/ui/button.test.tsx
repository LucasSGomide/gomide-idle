/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

// task 01: a component renders under Vitest with jsdom, proving the runner and
// the environment are wired.
describe('Button', () => {
  it('renders its label as a real <button>', () => {
    render(<Button>Reload</Button>);
    const button = screen.getByRole('button', { name: 'Reload' });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  // design.md §5 / §13: the label wraps rather than truncating.
  it('does not truncate its label', () => {
    render(<Button>Recarregar a página para continuar</Button>);
    const button = screen.getByRole('button');
    expect(button.className).not.toMatch(/\btruncate\b/);
    expect(button.className).toContain('whitespace-normal');
  });
});
