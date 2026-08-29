import { Inject, Injectable } from '@nestjs/common';

import type { AuthUserType } from '@gomide/contracts';

import { ENV, type EnvType } from '../../../config/env.js';
import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';

export type GetSessionInputType = {
  headers: Headers;
};

export type GetSessionResultType = {
  user: AuthUserType | null;
  // auth.md rule 33 / FR.2.6: the session row's id, so the socket handshake can
  // store it on the connection and a delete can close exactly that session's
  // sockets. Null when there is no session.
  sessionId: string | null;
  // FR.5.2 / auth.md rule 18: the registration flag rides on the session read so
  // the web hides the sign-up link rather than guessing.
  registrationOpen: boolean;
};

@Injectable()
export class GetSessionUseCase {
  constructor(
    @Inject(AUTH_INSTANCE) private readonly auth: AuthInstanceType,
    @Inject(ENV) private readonly env: EnvType,
  ) {}

  // FR.2.1: the session is a server-side row read from the cookie. A missing or
  // expired session is `null`, never an error — GET auth/session is public
  // (task 03) and the socket handshake (task 05) reuses this same read
  // (auth.md rule 32; the handshake ignores registrationOpen).
  async execute(input: GetSessionInputType): Promise<GetSessionResultType> {
    const session = await this.auth.api.getSession({ headers: input.headers });
    const registrationOpen = this.env.AUTH_REGISTRATION_OPEN;
    if (!session?.user)
      return { user: null, sessionId: null, registrationOpen };
    return {
      user: { id: session.user.id, email: session.user.email },
      sessionId: session.session.id,
      registrationOpen,
    };
  }
}
