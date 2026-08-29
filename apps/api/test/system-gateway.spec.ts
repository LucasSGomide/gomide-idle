import { jest } from '@jest/globals';

import { SystemGateway } from '../src/modules/system/entrypoint/system.gateway.js';
import { SessionSocketRegistry } from '../src/modules/system/entrypoint/session-socket.registry.js';
import { SessionCloseBus } from '../src/realtime/session-close.bus.js';
import type { AppLogger } from '../src/logging/app-logger.js';
import type { GetServerMetaUseCase } from '../src/modules/system/application/get-server-meta.use-case.js';
import type { GetSessionUseCase } from '../src/modules/auth/application/get-session.use-case.js';

type FakeSocket = {
  id: string;
  data: Record<string, unknown>;
  handshake: { headers: Record<string, string> };
  emitted: Array<[string, unknown]>;
  disconnected: boolean;
  listeners: Record<string, () => void>;
  emit: (event: string, payload: unknown) => void;
  disconnect: (close?: boolean) => void;
  on: (event: string, fn: () => void) => void;
};

function makeSocket(id: string, cookie = ''): FakeSocket {
  const socket: FakeSocket = {
    id,
    data: {},
    handshake: { headers: cookie ? { cookie } : {} },
    emitted: [],
    disconnected: false,
    listeners: {},
    emit(event, payload) {
      this.emitted.push([event, payload]);
    },
    disconnect() {
      this.disconnected = true;
    },
    on(event, fn) {
      this.listeners[event] = fn;
    },
  };
  return socket;
}

function makeSut() {
  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const metaResult = {
    socketProtocolVersion: 1,
    contentPackVersion: '0.1.0',
    buildId: 'x',
  };
  const serverMeta = { execute: jest.fn(async () => metaResult) };
  const session = {
    user: null as { id: string; email: string } | null,
    sessionId: null as string | null,
    registrationOpen: true,
  };
  const getSession = { execute: jest.fn(async () => session) };
  const registry = new SessionSocketRegistry();
  const bus = new SessionCloseBus();
  const gateway = new SystemGateway(
    logger as unknown as AppLogger,
    serverMeta as unknown as GetServerMetaUseCase,
    getSession as unknown as GetSessionUseCase,
    registry,
    bus,
  );
  gateway.onModuleInit();
  return {
    gateway,
    logger,
    serverMeta,
    getSession,
    session,
    registry,
    bus,
    metaResult,
  };
}

// FR.3.2 / auth.md rules 14, 32-33.
describe('SystemGateway', () => {
  it('refuses a handshake with no session using a NO_SESSION error frame, not a bare disconnect', async () => {
    const { gateway } = makeSut();
    const socket = makeSocket('sock-anon');

    await gateway.handleConnection(socket as never);

    expect(socket.emitted[0]?.[0]).toBe('error');
    const frame = socket.emitted[0]?.[1] as { code?: string } | undefined;
    expect(frame?.code).toBe('NO_SESSION');
    expect(socket.disconnected).toBe(true);
    expect(socket.emitted.some(([event]) => event === 'handshake')).toBe(false);
  });

  it('accepts a handshake carrying a session and stores that session id on the connection', async () => {
    const { gateway, session, registry } = makeSut();
    session.user = { id: 'user-1', email: 'a@b.c' };
    session.sessionId = 'sess-1';
    const socket = makeSocket('sock-1', 'better-auth.session_token=abc');

    await gateway.handleConnection(socket as never);

    expect(socket.data.sessionId).toBe('sess-1');
    expect(socket.emitted).toContainEqual([
      'handshake',
      { protocolVersion: 1 },
    ]);
    expect(registry.socketsFor('sess-1')).toHaveLength(1);
  });

  it('closes a session’s sockets when that session is deleted, and leaves another session’s alone', async () => {
    const { gateway, session, bus } = makeSut();
    session.user = { id: 'user-1', email: 'a@b.c' };

    session.sessionId = 'sess-A';
    const a = makeSocket('sock-a', 'c=A');
    await gateway.handleConnection(a as never);

    session.sessionId = 'sess-B';
    const b = makeSocket('sock-b', 'c=B');
    await gateway.handleConnection(b as never);

    bus.publish('sess-A');

    expect(a.disconnected).toBe(true);
    const lastFrame = a.emitted.at(-1)?.[1] as { code?: string } | undefined;
    expect(lastFrame?.code).toBe('NO_SESSION');
    expect(b.disconnected).toBe(false);
  });

  it('accepts a valid handshake message payload and echoes the protocol integer', () => {
    const { gateway } = makeSut();
    expect(
      gateway.handshake({ correlationId: 'c1', protocolVersion: 1 }),
    ).toEqual({ event: 'handshake', data: { protocolVersion: 1 } });
  });

  it('throws HANDSHAKE_INVALID with the zod issues on a malformed payload', () => {
    const { gateway } = makeSut();
    try {
      gateway.handshake({ protocolVersion: 'nope' });
      throw new Error('expected handshake to throw');
    } catch (error) {
      expect((error as { code?: string }).code).toBe('HANDSHAKE_INVALID');
    }
  });

  it('calls the same use case an HTTP controller would for server-meta, deciding nothing', async () => {
    const { gateway, serverMeta, metaResult } = makeSut();
    const client = { id: 'sock-2', data: { connectionId: 'sock-2' } };
    const result = await gateway.serverMeta(
      { correlationId: 'c2' },
      client as never,
    );
    expect(serverMeta.execute).toHaveBeenCalledWith({});
    expect(result).toEqual({ event: 'server-meta', data: metaResult });
  });
});
