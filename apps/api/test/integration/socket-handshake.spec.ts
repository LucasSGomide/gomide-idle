import { jest } from '@jest/globals';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { io, type Socket as ClientSocket } from 'socket.io-client';

import { socketErrorFrameSchema } from '@gomide/contracts';

import { createApiApp } from '../../src/bootstrap.js';
import { LineSink } from '../support/line-sink.js';
import { makeTestEnv } from '../support/env.js';

jest.setTimeout(30_000);

// Uses the polling transport: Jest's --experimental-vm-modules loader mangles the
// websocket transport's binary frames, and every AC here is a transport-agnostic
// handshake / error / logging behaviour.
describe('the socket handshake and its error twin (FR.10.3, FR.13.2)', () => {
  let app: NestFastifyApplication;
  let url: string;
  const sink = new LineSink();
  const open: ClientSocket[] = [];

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv(), { logDestination: sink });
    await app.listen(0, '127.0.0.1');
    url = (await app.getUrl())
      .replace('[::1]', '127.0.0.1')
      .replace('0.0.0.0', '127.0.0.1');
  });

  afterAll(async () => {
    // Closing the server drops the client connections; closing the socket.io
    // polling client explicitly throws inside engine.io-parser under Jest's
    // vm-modules loader, so we let the server-side close do it.
    for (const socket of open) socket.removeAllListeners();
    await app.close();
  });

  function connect(): Promise<{ socket: ClientSocket; handshake: unknown }> {
    return new Promise((resolve, reject) => {
      const socket = io(url, {
        transports: ['polling'],
        reconnection: false,
        forceNew: true,
      });
      open.push(socket);
      const timer = setTimeout(
        () => reject(new Error('handshake timed out')),
        10_000,
      );
      timer.unref();
      socket.once('handshake', (handshake) => {
        clearTimeout(timer);
        resolve({ socket, handshake });
      });
      socket.once('connect_error', (error) => {
        clearTimeout(timer);
        reject(new Error(error.message));
      });
    });
  }

  const once = <T>(socket: ClientSocket, event: string): Promise<T> =>
    new Promise((resolve) =>
      socket.once(event, resolve as (value: unknown) => void),
    );

  it('sends the protocol integer at the handshake, with no session or credential present', async () => {
    const { socket, handshake } = await connect();
    expect(handshake).toEqual({ protocolVersion: 1 });
    expect(socket.connected).toBe(true);
  });

  it('rejects a handshake payload failing the libs/contracts schema with a code, and stays open', async () => {
    const { socket } = await connect();

    socket.emit('handshake', { correlationId: 'h1', protocolVersion: 'nope' });
    const frame = await once<unknown>(socket, 'error');

    const parsed = socketErrorFrameSchema.parse(frame);
    expect(parsed.code).toBe('HANDSHAKE_INVALID');
    expect(parsed.correlationId).toBe('h1');
    expect(Object.keys(parsed).sort()).toEqual([
      'children',
      'code',
      'correlationId',
      'message',
    ]);
    expect(Array.isArray(parsed.children)).toBe(true);
    expect(socket.connected).toBe(true);
  });

  it("a log line during inbound-message handling carries the connection context and that message's own correlation id", async () => {
    sink.lines.length = 0;
    const { socket } = await connect();

    socket.emit('server-meta', { correlationId: 'msg-77' });
    await once(socket, 'server-meta');

    const line = sink.lines.find(
      (entry) => entry.message === 'handling server-meta over the socket',
    );
    expect(line).toBeDefined();
    expect(line?.module).toBe('SystemGateway');
    expect(line?.correlationId).toBe('msg-77');
    expect(typeof line?.connectionId).toBe('string');
  });
});
