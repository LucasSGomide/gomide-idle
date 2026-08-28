import {
  socketErrorFrameSchema,
  socketHandshakeSchema,
  socketInboundEnvelopeSchema,
} from '../src/socket.schema.js';

describe('the socket schemas', () => {
  it('each carries an explicit .meta({ id }) (stack-api rule 47)', () => {
    expect(socketInboundEnvelopeSchema.meta()).toEqual({
      id: 'SocketInboundEnvelope',
    });
    expect(socketHandshakeSchema.meta()).toEqual({ id: 'SocketHandshake' });
    expect(socketErrorFrameSchema.meta()).toEqual({ id: 'SocketErrorFrame' });
  });

  it('the handshake requires a correlation id and an integer protocol version', () => {
    expect(() =>
      socketHandshakeSchema.parse({ correlationId: 'c1', protocolVersion: 1 }),
    ).not.toThrow();
    expect(() => socketHandshakeSchema.parse({ protocolVersion: 1 })).toThrow();
    expect(() =>
      socketHandshakeSchema.parse({
        correlationId: 'c1',
        protocolVersion: 1.5,
      }),
    ).toThrow();
  });
});
