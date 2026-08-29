import { EventEmitter } from 'node:events';

import { Injectable } from '@nestjs/common';

// auth.md rule 33 / FR.2.6: deleting a session must close the sockets that
// session opened, at once. The HTTP sign-out (auth module) and the socket
// registry (system module) never import each other; they meet here.
//
// stack-api.md rule 24: one process, so an in-memory emitter is enough. A
// second process needs this to be a shared channel first — see auth.md's
// Known gaps.
export const SESSION_CLOSE_BUS = Symbol('SESSION_CLOSE_BUS');

const CLOSED = 'session-closed';

@Injectable()
export class SessionCloseBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Many gateways could subscribe over the app's life; lift the default cap.
    this.emitter.setMaxListeners(0);
  }

  publish(sessionId: string): void {
    this.emitter.emit(CLOSED, sessionId);
  }

  subscribe(listener: (sessionId: string) => void): () => void {
    this.emitter.on(CLOSED, listener);
    return () => this.emitter.off(CLOSED, listener);
  }
}
