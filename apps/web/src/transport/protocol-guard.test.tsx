/** @vitest-environment jsdom */
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import {
  ProtocolCheckerProvider,
  useProtocolGuard,
  type ProtocolCheckResult,
} from './protocol-guard';

function wrapper(result: ProtocolCheckResult) {
  return ({ children }: { children: ReactNode }) => (
    <ProtocolCheckerProvider checker={async () => result}>
      {children}
    </ProtocolCheckerProvider>
  );
}

describe('useProtocolGuard', () => {
  it('starts checking, then settles on ok for a matching protocol', async () => {
    const { result } = renderHook(() => useProtocolGuard(), {
      wrapper: wrapper({ status: 'ok' }),
    });
    expect(result.current).toBe('checking');
    await waitFor(() => expect(result.current).toBe('ok'));
  });

  it('settles on mismatch when the handshake disagrees', async () => {
    const { result } = renderHook(() => useProtocolGuard(), {
      wrapper: wrapper({ status: 'mismatch', serverProtocol: 99 }),
    });
    await waitFor(() => expect(result.current).toBe('mismatch'));
  });
});
