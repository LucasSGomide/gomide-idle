import { setupServer } from 'msw/node';

import { SOCKET_PROTOCOL_VERSION } from '../protocol';
import type { ServerMetaResponse, SessionResponse } from './generated/model';
import {
  getAuthControllerGetCurrentSessionMockHandler,
  getServerMetaControllerGetMockHandler,
} from './generated/tormented-path';

// stack-web.md rule 58 / FR.15.4: MSW at the network boundary, with handlers
// Orval generated from the same document the hooks came from. A test overrides a
// handler with `mockServer.use(...)`; the defaults below keep an un-overridden
// test coherent — the protocol integer in step with the client's, and a
// signed-out session so the shell's session-aware chrome has an answer.

export const DEFAULT_SERVER_META: ServerMetaResponse = {
  socketProtocolVersion: SOCKET_PROTOCOL_VERSION,
  contentPackVersion: '2026.08.1',
  buildId: 'testbuild',
};

export const DEFAULT_SESSION: SessionResponse = {
  user: null,
  registrationOpen: true,
};

export const mockServer = setupServer(
  getServerMetaControllerGetMockHandler(DEFAULT_SERVER_META),
  getAuthControllerGetCurrentSessionMockHandler(DEFAULT_SESSION),
);
