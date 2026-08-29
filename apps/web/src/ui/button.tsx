import type { ButtonHTMLAttributes } from 'react';

// A copied-in primitive (stack-web.md rule 25), restyled with the generated
// theme's utilities — no raw colour, size, radius or duration (rule 46). Edited
// in place, never wrapped (rule 47). Structure follows shadcn/ui; the states are
// design.md §5's default / hover / active / focus / disabled.
//
// design.md §5 / §13: a button never truncates its label. Portuguese runs
// longer, so the label wraps to a second line and the button grows rather than
// taking an ellipsis — `whitespace-normal`, no `truncate`.

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium ' +
  'whitespace-normal text-center transition-colors duration-fast ease-standard ' +
  'min-h-(--size-touch-target-min) px-5 py-3 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-bg ' +
  'disabled:opacity-40 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-on-accent hover:bg-accent-hover active:bg-accent-active',
  secondary:
    'bg-surface text-text-primary border border-border-strong ' +
    'hover:bg-surface-hover',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-hover',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
