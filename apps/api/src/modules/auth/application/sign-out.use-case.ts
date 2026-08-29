import { Inject, Injectable } from '@nestjs/common';

import { SessionCloseBus } from '../../../realtime/session-close.bus.js';
import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';
import {
  toAuthApiResult,
  type AuthApiResultType,
} from './auth-api-result.type.js';

export type SignOutInputType = {
  headers: Headers;
  // The session guard put this on the request (auth.md rule 13's pattern):
  // the id of the session this sign-out deletes, so its sockets can be closed.
  sessionId: string | null;
};

@Injectable()
export class SignOutUseCase {
  constructor(
    @Inject(AUTH_INSTANCE) private readonly auth: AuthInstanceType,
    // Explicit token @Inject so the tsx preview-mode OpenAPI boot resolves it.
    @Inject(SessionCloseBus) private readonly sessionCloseBus: SessionCloseBus,
  ) {}

  // FR.2.1, FR.2.4: sign-out deletes the row for the session the cookie names
  // and clears that cookie; another device's session row is untouched. FR.2.6 /
  // auth.md rule 33: the delete also closes the sockets that session opened.
  async execute(input: SignOutInputType): Promise<AuthApiResultType> {
    const response = await this.auth.api.signOut({
      headers: input.headers,
      asResponse: true,
    });
    const result = await toAuthApiResult(response);
    if (result.ok && input.sessionId) {
      this.sessionCloseBus.publish(input.sessionId);
    }
    return result;
  }
}
