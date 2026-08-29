import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { checkSocketProtocol, type ProtocolCheckResult } from './socket';

export type { ProtocolCheckResult } from './socket';

// The seam architecture-web.md rule 19 asks for: the shell reads the protocol
// check through this context, and a test provides a fake instead of a live
// socket. The default is the real same-origin handshake.
type ProtocolChecker = () => Promise<ProtocolCheckResult>;

const ProtocolCheckerContext = createContext<ProtocolChecker>(() =>
  checkSocketProtocol(),
);

export function ProtocolCheckerProvider({
  checker,
  children,
}: {
  checker: ProtocolChecker;
  children: ReactNode;
}) {
  return (
    <ProtocolCheckerContext.Provider value={checker}>
      {children}
    </ProtocolCheckerContext.Provider>
  );
}

export type ProtocolGuardState = 'checking' | 'ok' | 'mismatch';

// Runs the handshake behind the shell: `checking` and `ok` leave the screen
// untouched, `mismatch` tells the shell to replace the page with the
// out-of-date screen (stack-web.md rule 22 — a refusal, not a degraded mode).
export function useProtocolGuard(): ProtocolGuardState {
  const checker = useContext(ProtocolCheckerContext);
  const [state, setState] = useState<ProtocolGuardState>('checking');

  useEffect(() => {
    let active = true;
    void checker().then((result) => {
      if (active) {
        setState(result.status === 'mismatch' ? 'mismatch' : 'ok');
      }
    });
    return () => {
      active = false;
    };
  }, [checker]);

  return state;
}
