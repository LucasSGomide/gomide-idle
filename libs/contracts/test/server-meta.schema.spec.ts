import { serverMetaResponseSchema } from '../src/server-meta.schema.js';

describe('serverMetaResponseSchema', () => {
  it('carries an explicit .meta({ id }) so its generated type is named, not positional (stack-api rule 47)', () => {
    expect(serverMetaResponseSchema.meta()).toEqual({ id: 'ServerMetaResponse' });
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
