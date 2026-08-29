import type { ReactNode } from 'react';

import { Button } from '@/ui/button';

// design.md §5 Buttons (loading): the spinner replaces the label at the same
// size, the button does not resize, and it never switches to the disabled
// style — pointer events off so it reads busy, not unavailable. The label stays
// in the layout as `invisible` and the spinner overlays it, so the width is
// fixed. §7: motion-safe only.
export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="submit"
      aria-busy={pending}
      className={'relative w-full' + (pending ? ' pointer-events-none' : '')}
    >
      <span className={pending ? 'invisible' : undefined}>{children}</span>
      {pending ? (
        <span
          role="status"
          aria-label="Submitting"
          className={
            'absolute inset-0 m-auto size-5 rounded-full border-2 ' +
            'border-current/30 border-t-current motion-safe:animate-spin'
          }
        />
      ) : null}
    </Button>
  );
}
