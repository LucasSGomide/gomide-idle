import {
  SERVER_META_RESPONSE_SCHEMA_ID,
  serverMetaResponseSchema,
} from '../src/server-meta.schema.js';

describe('serverMetaResponseSchema', () => {
  it('declares the explicit name its OpenAPI component must carry (stack-api rule 47)', () => {
    expect(SERVER_META_RESPONSE_SCHEMA_ID).toBe('ServerMetaResponse');
  });

  it('accepts a well-formed server_meta payload', () => {
    const value = serverMetaResponseSchema.parse({
      socketProtocolVersion: 1,
      contentPackVersion: '0.1.0',
      buildId: 'abc123',
    });
    expect(value).toEqual({
      socketProtocolVersion: 1,
      contentPackVersion: '0.1.0',
      buildId: 'abc123',
    });
  });

  it('rejects a non-integer protocol version', () => {
    expect(() =>
      serverMetaResponseSchema.parse({
        socketProtocolVersion: 1.5,
        contentPackVersion: '0.1.0',
        buildId: 'abc123',
      }),
    ).toThrow();
  });
});
