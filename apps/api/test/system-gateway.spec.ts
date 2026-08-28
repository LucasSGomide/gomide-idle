import { jest } from '@jest/globals';

import { SystemGateway } from '../src/modules/system/entrypoint/system.gateway.js';
import type { AppLogger } from '../src/logging/app-logger.js';
import type { GetServerMetaUseCase } from '../src/modules/system/application/get-server-meta.use-case.js';

function makeSut() {
  const logger = { info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const metaResult = { socketProtocolVersion: 1, contentPackVersion: '0.1.0', buildId: 'x' };
  const useCase = { execute: jest.fn(async () => metaResult) };
  const gateway = new SystemGateway(
    logger as unknown as AppLogger,
    useCase as unknown as GetServerMetaUseCase,
  );
  return { gateway, logger, useCase, metaResult };
}

describe('SystemGateway', () => {
  it('sends the protocol integer on connect, with no session checked', () => {
    const { gateway } = makeSut();
    const emitted: Array<[string, unknown]> = [];
    const client = {
      id: 'sock-1',
      data: {} as Record<string, unknown>,
      emit: (event: string, payload: unknown) => emitted.push([event, payload]),
    };
    gateway.handleConnection(client as never);
    expect(emitted).toEqual([['handshake', { protocolVersion: 1 }]]);
    expect(client.data.connectionId).toBe('sock-1');
  });

  it('accepts a valid handshake payload and echoes the protocol integer', () => {
    const { gateway } = makeSut();
    expect(gateway.handshake({ correlationId: 'c1', protocolVersion: 1 })).toEqual({
      event: 'handshake',
      data: { protocolVersion: 1 },
    });
  });

  it('throws HANDSHAKE_INVALID with the zod issues on a malformed payload', () => {
    const { gateway } = makeSut();
    try {
      gateway.handshake({ protocolVersion: 'nope' });
      throw new Error('expected handshake to throw');
    } catch (error) {
      expect((error as { code?: string }).code).toBe('HANDSHAKE_INVALID');
      const body = (error as { getResponse: () => Record<string, unknown> }).getResponse();
      expect(Array.isArray(body.children)).toBe(true);
    }
  });

  it('calls the same use case an HTTP controller would, deciding nothing', async () => {
    const { gateway, useCase, metaResult } = makeSut();
    const client = { id: 'sock-2', data: { connectionId: 'sock-2' } };
    const result = await gateway.serverMeta({ correlationId: 'c2' }, client as never);
    expect(useCase.execute).toHaveBeenCalledWith({});
    expect(result).toEqual({ event: 'server-meta', data: metaResult });
  });
});
