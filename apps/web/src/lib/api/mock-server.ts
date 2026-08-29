import { setupServer } from 'msw/node';

import { SOCKET_PROTOCOL_VERSION } from '../protocol';
import type { ServerMetaResponse } from './generated/model';
import { getServerMetaControllerGetMockHandler } from './generated/tormented-path';

// stack-web.md rule 58 / FR.15.4: MSW at the network boundary, with handlers
// Orval generated from the same document the hooks came from. A test overrides a
// handler with `mockServer.use(...)`; the default below keeps the protocol
// integer in step with the client's so an un-overridden test is still coherent.

export const DEFAULT_SERVER_META: ServerMetaResponse = {
  socketProtocolVersion: SOCKET_PROTOCOL_VERSION,
  contentPackVersion: '2026.08.1',
  buildId: 'testbuild',
};

export const mockServer = setupServer(
  getServerMetaControllerGetMockHandler(DEFAULT_SERVER_META),
);
