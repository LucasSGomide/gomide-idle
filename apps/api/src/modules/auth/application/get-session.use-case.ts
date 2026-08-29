import { Inject, Injectable } from '@nestjs/common';

import type { AuthUserType } from '@gomide/contracts';

import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';

export type GetSessionInputType = {
  headers: Headers;
};

export type GetSessionResultType = {
  user: AuthUserType | null;
};

@Injectable()
export class GetSessionUseCase {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstanceType) {}

  // FR.2.1: the session is a server-side row read from the cookie. A missing or
  // expired session is `null`, never an error — GET auth/session is public
  // (task 03) and the socket handshake (task 05) reuses this same read
  // (auth.md rule 32).
  async execute(input: GetSessionInputType): Promise<GetSessionResultType> {
    const session = await this.auth.api.getSession({ headers: input.headers });
    if (!session?.user) return { user: null };
    return {
      user: { id: session.user.id, email: session.user.email },
    };
  }
}
