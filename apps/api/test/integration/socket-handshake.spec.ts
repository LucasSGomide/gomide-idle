import { jest } from '@jest/globals';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { io, type Socket as ClientSocket } from 'socket.io-client';
import postgres from 'postgres';

import { socketErrorFrameSchema } from '@gomide/contracts';

import { createApiApp } from '../../src/bootstrap.js';
import { SessionSocketRegistry } from '../../src/modules/system/entrypoint/session-socket.registry.js';
import { LineSink } from '../support/line-sink.js';
import { makeTestEnv } from '../support/env.js';

jest.setTimeout(30_000);

const password = 'a-correct-horse-battery-staple';
const uniqueEmail = (): string =>
  `sock_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

// Uses the polling transport: Jest's --experimental-vm-modules loader mangles the
// websocket transport's binary frames, and every AC here is a transport-agnostic
// handshake / error / origin behaviour.
describe('the socket handshake: session check and Origin check (task 05/05)', () => {
  let app: NestFastifyApplication;
  let url: string;
  let sql: postgres.Sql;
  const sink = new LineSink();
  const open: ClientSocket[] = [];

  beforeAll(async () => {
    app = await createApiApp(makeTestEnv(), { logDestination: sink });
    await app.listen(0, '127.0.0.1');
    url = (await app.getUrl())
      .replace('[::1]', '127.0.0.1')
      .replace('0.0.0.0', '127.0.0.1');
    sql = postgres(process.env.DATABASE_URL as string, { max: 2 });
  });

  afterAll(async () => {
    for (const socket of open) socket.removeAllListeners();
    await sql.end();
    await app.close();
  });

  const cookieOf = (headers: Record<string, unknown>): string => {
    const raw = headers['set-cookie'];
    const list = Array.isArray(raw) ? raw : [raw as string];
    return list.map((cookie) => cookie.split(';')[0]).join('; ');
  };

  const signUp = async (email: string) =>
    app.inject({
      method: 'POST',
      url: '/auth/sign-up',
      payload: { email, password },
    });

  const sessionIdFor = async (cookie: string): Promise<string> => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/session',
      headers: { cookie },
    });
    const rows = await sql<{ id: string }[]>`
      select s.id from "session" s
      join "user" u on u.id = s.user_id
      where u.email = ${(res.json() as { user: { email: string } }).user.email}
      order by s.created_at desc limit 1
    `;
    return rows[0]!.id;
  };

  function open_(opts: {
    cookie?: string;
    origin?: string;
  }): Promise<{ socket: ClientSocket; event: string; payload: unknown }> {
    return new Promise((resolve, reject) => {
      const socket = io(url, {
        transports: ['polling'],
        reconnection: false,
        forceNew: true,
        ...(opts.cookie ? { extraHeaders: { Cookie: opts.cookie } } : {}),
        ...(opts.origin
          ? {
              extraHeaders: {
                ...(opts.cookie ? { Cookie: opts.cookie } : {}),
                Origin: opts.origin,
              },
            }
          : {}),
      });
      open.push(socket);
      const timer = setTimeout(
        () => reject(new Error('socket timed out')),
        10_000,
      );
      timer.unref();
      const done = (event: string, payload: unknown): void => {
        clearTimeout(timer);
        resolve({ socket, event, payload });
      };
      socket.once('handshake', (payload) => done('handshake', payload));
      socket.once('error', (payload) => done('error', payload));
      socket.once('connect_error', (error) => done('connect_error', error));
    });
  }

  it('a handshake carrying a valid session cookie connects, and the connection holds that session id', async () => {
    const email = uniqueEmail();
    const cookie = cookieOf((await signUp(email)).headers);
    const sessionId = await sessionIdFor(cookie);

    const { event } = await open_({ cookie });
    expect(event).toBe('handshake');

    const registry = app.get(SessionSocketRegistry);
    expect(registry.socketsFor(sessionId).length).toBeGreaterThan(0);
  });

  it('a handshake with no cookie is refused with a NO_SESSION error frame, not a bare disconnect', async () => {
    const { event, payload } = await open_({});
    expect(event).toBe('error');
    const frame = socketErrorFrameSchema.parse(payload);
    expect(frame.code).toBe('NO_SESSION');
  });

  it('a handshake carrying an expired session is refused with NO_SESSION', async () => {
    const email = uniqueEmail();
    const cookie = cookieOf((await signUp(email)).headers);
    await sql`
      update "session" set expires_at = now() - interval '1 hour'
      from "user" u where "session".user_id = u.id and u.email = ${email}
    `;

    const { event, payload } = await open_({ cookie });
    expect(event).toBe('error');
    expect(socketErrorFrameSchema.parse(payload).code).toBe('NO_SESSION');
  });

  it('a handshake from an origin outside the allowed list is refused, and one from an allowed origin connects', async () => {
    const email = uniqueEmail();
    const cookie = cookieOf((await signUp(email)).headers);

    const refused = await open_({ cookie, origin: 'http://evil.example' });
    expect(refused.event).toBe('connect_error');

    const email2 = uniqueEmail();
    const cookie2 = cookieOf((await signUp(email2)).headers);
    const accepted = await open_({
      cookie: cookie2,
      origin: 'http://localhost:5173',
    });
    expect(accepted.event).toBe('handshake');
  });

  it('POST auth/sign-out closes that session’s connections while a second session’s connection for the same user stays open', async () => {
    const email = uniqueEmail();
    const cookieA = cookieOf((await signUp(email)).headers);
    const signInB = await app.inject({
      method: 'POST',
      url: '/auth/sign-in',
      payload: { email, password },
    });
    const cookieB = cookieOf(signInB.headers);

    const a = await open_({ cookie: cookieA });
    const b = await open_({ cookie: cookieB });
    expect(a.event).toBe('handshake');
    expect(b.event).toBe('handshake');

    const closedA = new Promise<unknown>((resolve) =>
      a.socket.once('error', resolve),
    );
    await app.inject({
      method: 'POST',
      url: '/auth/sign-out',
      headers: { cookie: cookieA },
    });

    expect(socketErrorFrameSchema.parse(await closedA).code).toBe('NO_SESSION');
    expect(b.socket.connected).toBe(true);
  });

  it("a log line during inbound-message handling carries the connection context and that message's own correlation id", async () => {
    sink.lines.length = 0;
    const email = uniqueEmail();
    const cookie = cookieOf((await signUp(email)).headers);
    const { socket } = await open_({ cookie });

    socket.emit('server-meta', { correlationId: 'msg-77' });
    await new Promise<void>((resolve) =>
      socket.once('server-meta', () => resolve()),
    );

    const line = sink.lines.find(
      (entry) => entry.message === 'handling server-meta over the socket',
    );
    expect(line?.module).toBe('SystemGateway');
    expect(line?.correlationId).toBe('msg-77');
    expect(typeof line?.connectionId).toBe('string');
  });
});
