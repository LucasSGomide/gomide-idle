import { useEffect, useRef, useState } from 'react';

// The open/close behaviour shared by the standalone language switcher and the
// account menu: a click outside or Escape closes it. design.md §7 — hover
// changes fill only; the menu just appears.
export function useMenuToggle(): {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
} {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return { open, setOpen, containerRef };
}
