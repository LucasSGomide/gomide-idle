import { LanguageSwitcher } from './language-switcher';
import { Wordmark } from './wordmark';

// design.md §1 / FR.16.2: a persistent top bar 56px tall (`h-14`), inside §1's
// centered container — max 1440px, 32px page margins (`px-8`). The signed-out
// Account/login row is the wordmark left and a standalone language switcher
// right, and nothing else: no navigation slot, no account menu, because no
// account exists yet.
export function TopBar() {
  return (
    <header className="h-14 shrink-0 border-b border-border-subtle bg-bg">
      <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between px-8">
        <Wordmark />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
