import { jest } from '@jest/globals';
import { GetServerMetaUseCase } from '../src/modules/system/application/get-server-meta.use-case.js';
import type { GetServerMetaDaoPort } from '../src/modules/system/application/get-server-meta.dao.port.js';
import { GET_SERVER_META_DAO } from '../src/modules/system/application/tokens.js';
import { ServerMetaController } from '../src/modules/system/entrypoint/server-meta.controller.js';
import type { EnvType } from '../src/config/env.js';

function makeSut() {
  const daoRow = {
    socketProtocolVersion: 1,
    contentPackVersion: '0.1.0',
    buildId: 'unknown',
  };
  const dao: GetServerMetaDaoPort = {
    getServerMeta: jest.fn(async () => daoRow),
  };
  const env = { BUILD_ID: 'running-build-99' } as EnvType;
  const useCase = new GetServerMetaUseCase(dao, env);
  return { useCase, dao, daoRow };
}

describe('GetServerMetaUseCase', () => {
  it('depends on GetServerMetaDaoPort, not the DAO implementation', async () => {
    const { useCase, dao } = makeSut();
    // A hand-rolled object satisfies the port — nothing about the concrete DAO
    // is reachable from here.
    const result = await useCase.execute({});
    expect(dao.getServerMeta).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      socketProtocolVersion: 1,
      contentPackVersion: '0.1.0',
      buildId: 'running-build-99',
    });
  });

  it('exposes exactly one public method, execute', () => {
    const names = Object.getOwnPropertyNames(GetServerMetaUseCase.prototype).sort();
    expect(names).toEqual(['constructor', 'execute']);
  });
});

describe('ServerMetaController (architecture-api.md rule 24)', () => {
  it('maps the request to the use-case input and the result straight back, deciding nothing', async () => {
    const sentinel = {
      socketProtocolVersion: 1,
      contentPackVersion: '0.1.0',
      buildId: 'x',
    };
    const useCase = { execute: jest.fn(async () => sentinel) };
    const controller = new ServerMetaController(
      useCase as unknown as GetServerMetaUseCase,
    );

    const result = await controller.get();

    expect(useCase.execute).toHaveBeenCalledWith({});
    expect(result).toBe(sentinel);
    // one public method
    expect(Object.getOwnPropertyNames(ServerMetaController.prototype).sort()).toEqual(
      ['constructor', 'get'],
    );
  });
});

describe('the GET_SERVER_META_DAO injection token (naming.md rule 12)', () => {
  const tokenNameFor = (portName: string): string =>
    portName
      .replace(/Port$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toUpperCase();

  it('is named after the port it satisfies', () => {
    expect(GET_SERVER_META_DAO.description).toBe(tokenNameFor('GetServerMetaDaoPort'));
    expect(GET_SERVER_META_DAO.description).toBe('GET_SERVER_META_DAO');
  });
});
