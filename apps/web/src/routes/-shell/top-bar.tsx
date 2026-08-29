import { useSession } from '@/features/session/use-session';

import { AccountMenu } from './account-menu';
import { LanguageSwitcher } from './language-switcher';
import { Wordmark } from './wordmark';

// design.md §1 / FR.16.2: a persistent top bar 56px tall (`h-14`), inside §1's
// centered container — max 1440px, 32px page margins (`px-8`). The right slot
// follows the session (architecture-web.md rule 33 lets the chrome read it):
// while it is unresolved the slot is empty — painting the signed-out switcher
// there is the flash the States bullet forbids, and painting the account menu
// asserts a session nobody has confirmed. Signed in it is §1's Character-select
// account menu; signed out, the standalone switcher (§13).
export function TopBar() {
  const session = useSession();

  return (
    <header className="h-14 shrink-0 border-b border-border-subtle bg-bg">
      <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between px-8">
        <Wordmark />
        {session.isPending ? null : session.data?.user ? (
          <AccountMenu />
        ) : (
          <LanguageSwitcher />
        )}
      </div>
    </header>
  );
}
