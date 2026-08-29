import {
  HttpStatus,
  UseFilters,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  type WsResponse,
} from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import {
  SOCKET_PROTOCOL_VERSION,
  socketHandshakeSchema,
} from '@gomide/contracts';

import { AllExceptionsFilter } from '../../../errors/all-exceptions.filter.js';
import { CodedException } from '../../../errors/coded-exception.js';
import { AppLogger } from '../../../logging/app-logger.js';
import {
  extractCorrelationId,
  runWithMessageContext,
} from '../../../logging/socket-logging.js';
import { SessionCloseBus } from '../../../realtime/session-close.bus.js';
import { GetSessionUseCase } from '../../auth/application/get-session.use-case.js';
import { GetServerMetaUseCase } from '../application/get-server-meta.use-case.js';
import { SessionSocketRegistry } from './session-socket.registry.js';

// FR.10.3: the handshake carries the protocol integer so a stale client refuses
// to connect. FR.3.2 / auth.md rules 14, 32: the handshake is authenticated
// against the same server-side session an HTTP request uses, read once here and
// its id stored on the connection; a handshake with no session is refused with a
// NO_SESSION error frame rather than a bare disconnect. The Origin check is the
// adapter's (OriginCheckedIoAdapter) — CORS does not govern the upgrade
// (stack-api.md rule 38), which is why @WebSocketGateway() carries no `cors`.
//
// The global AllExceptionsFilter is this gateway's error twin — a bad message
// gets an error frame with the same `code` an HTTP error would, and the
// connection stays open (architecture-api.md rules 24, 43, 45).
@WebSocketGateway()
@UseFilters(AllExceptionsFilter)
export class SystemGateway
  implements OnGatewayConnection, OnModuleInit, OnModuleDestroy
{
  private unsubscribe: (() => void) | undefined;

  constructor(
    private readonly logger: AppLogger,
    private readonly getServerMeta: GetServerMetaUseCase,
    private readonly getSession: GetSessionUseCase,
    private readonly registry: SessionSocketRegistry,
    private readonly sessionCloseBus: SessionCloseBus,
  ) {}

  onModuleInit(): void {
    // auth.md rule 33 / FR.2.6: deleting a session closes its sockets at once.
    this.unsubscribe = this.sessionCloseBus.subscribe((sessionId) => {
      for (const socket of this.registry.socketsFor(sessionId)) {
        socket.emit('error', {
          correlationId: 'session',
          code: 'NO_SESSION',
          message: 'Your session ended.',
        });
        socket.disconnect(true);
      }
    });
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
  }

  async handleConnection(client: Socket): Promise<void> {
    // architecture-api.md rule 53: the connection's log identity is fixed here,
    // once, at the handshake.
    client.data.connectionId = client.id;

    const headers = new Headers({
      cookie: client.handshake.headers.cookie ?? '',
    });
    const { user, sessionId } = await this.getSession.execute({ headers });

    if (!user || !sessionId) {
      // auth.md rule 14: a declared code in an error frame, not a bare close.
      client.emit('error', {
        correlationId: 'handshake',
        code: 'NO_SESSION',
        message: 'Sign in to continue.',
      });
      client.disconnect(true);
      return;
    }

    client.data.sessionId = sessionId;
    this.registry.add(sessionId, client);
    client.on('disconnect', () => this.registry.remove(sessionId, client));

    client.emit('handshake', { protocolVersion: SOCKET_PROTOCOL_VERSION });
  }

  @SubscribeMessage('handshake')
  handshake(
    @MessageBody() body: unknown,
  ): WsResponse<{ protocolVersion: number }> {
    const parsed = socketHandshakeSchema.safeParse(body);
    if (!parsed.success) {
      throw new CodedException(
        'HANDSHAKE_INVALID',
        'Handshake payload failed validation',
        HttpStatus.BAD_REQUEST,
        parsed.error.issues,
      );
    }
    return {
      event: 'handshake',
      data: { protocolVersion: SOCKET_PROTOCOL_VERSION },
    };
  }

  @SubscribeMessage('server-meta')
  serverMeta(
    @MessageBody() body: unknown,
    @ConnectedSocket() client: Socket,
  ): Promise<WsResponse<unknown>> {
    const correlationId = extractCorrelationId(body);
    const connectionId = String(client.data.connectionId ?? client.id);
    return runWithMessageContext(connectionId, correlationId, async () => {
      this.logger.info('handling server-meta over the socket', {
        transport: 'socket',
      });
      const data = await this.getServerMeta.execute({});
      return { event: 'server-meta', data };
    });
  }
}
