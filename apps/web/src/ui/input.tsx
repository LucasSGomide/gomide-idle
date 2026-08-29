import type { InputHTMLAttributes } from 'react';

// A copied-in primitive (stack-web.md rule 25), restyled with the generated
// theme's utilities — no raw colour, size, radius or duration (rule 46).
//
// design.md §5 Inputs: `surface` fill, `borderStrong` border, `textSecondary`
// placeholder; focus turns the border `accent` and adds the standard ring;
// error turns the border `danger` (the trailing icon and helper text are the
// field's, not this primitive's). §4: `space-3` vertical / `space-4` horizontal
// padding, `radius.sm`.

type Variant = 'default' | 'error';

const base =
  'w-full rounded-sm border bg-surface px-4 py-3 text-sm text-text-primary ' +
  'placeholder:text-text-secondary transition-colors duration-fast ' +
  'ease-standard focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg disabled:text-text-disabled ' +
  'disabled:border-border-subtle';

const variants: Record<Variant, string> = {
  default: 'border-border-strong focus-visible:border-accent',
  error: 'border-danger focus-visible:border-danger',
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: Variant;
};

export function Input({
  variant = 'default',
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={[base, variants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
