import { Inject, Injectable } from '@nestjs/common';

import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';
import {
  toAuthApiResult,
  type AuthApiResultType,
} from './auth-api-result.type.js';

// naming.md rules 1, 9: sign-up.use-case.ts exporting SignUpUseCase, input
// SignUpInputType. architecture-api.md rule 25: one `execute`, one typed input —
// so the same operation is reachable from any entrypoint. auth.md rule 3: the
// call to `auth.api` lives here, never a re-implementation of sign-in.
export type SignUpInputType = {
  email: string;
  password: string;
  headers: Headers;
};

@Injectable()
export class SignUpUseCase {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstanceType) {}

  async execute(input: SignUpInputType): Promise<AuthApiResultType> {
    // FR.1.1: autoSignIn is on (auth.options.ts), so a successful sign-up also
    // sets the session cookie. Better Auth requires a `name`; nothing in this
    // item surfaces it, so the e-mail's local part stands in.
    const response = await this.auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.email.split('@')[0] || input.email,
      },
      headers: input.headers,
      asResponse: true,
    });
    return toAuthApiResult(response);
  }
}
