import { IoAdapter } from '@nestjs/platform-socket.io';
import type { INestApplicationContext } from '@nestjs/common';
import type { Server, ServerOptions } from 'socket.io';

// stack-api.md rule 38 / FR.3.2: the WebSocket upgrade is not governed by CORS,
// so the Origin is checked here on every connection against the environment's
// allow-list (bootstrap.ts passes env.SOCKET_ALLOWED_ORIGINS). A request with no
// Origin header — a native client, a same-origin call — is allowed; a browser
// origin outside the list is refused at the handshake.
//
// The gateway's own @WebSocketGateway() therefore carries no `cors` option; it
// used to be `{ origin: true }`, which reflected whatever origin asked.
export class OriginCheckedIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly allowedOrigins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const allowed = new Set(this.allowedOrigins);
    const merged = {
      ...options,
      cors: { origin: this.allowedOrigins, credentials: true },
      allowRequest: (
        req: { headers: { origin?: string } },
        callback: (err: string | null | undefined, success: boolean) => void,
      ) => {
        const origin = req.headers.origin;
        callback(null, origin === undefined || allowed.has(origin));
      },
    } as ServerOptions;
    return super.createIOServer(port, merged) as Server;
  }
}
