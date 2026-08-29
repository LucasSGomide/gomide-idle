import { Injectable } from '@nestjs/common';
import type { Socket } from 'socket.io';

// auth.md rule 33 / FR.2.6: the session-id-to-connection map. It lives in the
// system module because system owns the only gateway (stack-api.md rule 30's
// correction note left this open; task 05 decides it here). Keyed by session id
// rather than account id, so signing out on one device (FR.2.4) does not close
// the socket another device is holding.
//
// stack-api.md rule 24: correct only in a single process. stack-api.md rule 35's
// online-slot registry is a different map (keyed by account) and is not this.
@Injectable()
export class SessionSocketRegistry {
  private readonly bySession = new Map<string, Set<Socket>>();

  add(sessionId: string, socket: Socket): void {
    const set = this.bySession.get(sessionId) ?? new Set<Socket>();
    set.add(socket);
    this.bySession.set(sessionId, set);
  }

  remove(sessionId: string, socket: Socket): void {
    const set = this.bySession.get(sessionId);
    if (!set) return;
    set.delete(socket);
    if (set.size === 0) this.bySession.delete(sessionId);
  }

  socketsFor(sessionId: string): Socket[] {
    return [...(this.bySession.get(sessionId) ?? [])];
  }
}
