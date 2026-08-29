import { Inject, Injectable } from '@nestjs/common';

import type { AuthUserType } from '@gomide/contracts';

import { ENV, type EnvType } from '../../../config/env.js';
import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';

export type GetSessionInputType = {
  headers: Headers;
};

export type GetSessionResultType = {
  user: AuthUserType | null;
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
    if (!session?.user) return { user: null, registrationOpen };
    return {
      user: { id: session.user.id, email: session.user.email },
      registrationOpen,
    };
  }
}
