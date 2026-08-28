import { HttpStatus, UseFilters } from '@nestjs/common';
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
import { GetServerMetaUseCase } from '../application/get-server-meta.use-case.js';

// FR.10.3: the handshake carries the protocol integer so a stale client refuses
// to connect. Unauthenticated for now (decided 2026-08-28): no session check.
// The global AllExceptionsFilter is this gateway's error twin — a bad message
// gets an error frame with the same `code` an HTTP error would, and the
// connection stays open (architecture-api.md rules 24, 43, 45).
@WebSocketGateway({ cors: { origin: true } })
@UseFilters(AllExceptionsFilter)
export class SystemGateway implements OnGatewayConnection {
  constructor(
    private readonly logger: AppLogger,
    private readonly getServerMeta: GetServerMetaUseCase,
  ) {}

  handleConnection(client: Socket): void {
    // architecture-api.md rule 53: the connection's log identity is fixed here,
    // once, at the handshake.
    client.data.connectionId = client.id;
    client.emit('handshake', { protocolVersion: SOCKET_PROTOCOL_VERSION });
  }

  @SubscribeMessage('handshake')
  handshake(@MessageBody() body: unknown): WsResponse<{ protocolVersion: number }> {
    const parsed = socketHandshakeSchema.safeParse(body);
    if (!parsed.success) {
      throw new CodedException(
        'HANDSHAKE_INVALID',
        'Handshake payload failed validation',
        HttpStatus.BAD_REQUEST,
        parsed.error.issues,
      );
    }
    return { event: 'handshake', data: { protocolVersion: SOCKET_PROTOCOL_VERSION } };
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
