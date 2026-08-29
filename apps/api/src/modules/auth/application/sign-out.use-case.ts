import { Inject, Injectable } from '@nestjs/common';

import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';
import {
  toAuthApiResult,
  type AuthApiResultType,
} from './auth-api-result.type.js';

export type SignOutInputType = {
  headers: Headers;
};

@Injectable()
export class SignOutUseCase {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstanceType) {}

  // FR.2.1, FR.2.4: sign-out deletes the row for the session the cookie names
  // and clears that cookie; another device's session row is untouched.
  async execute(input: SignOutInputType): Promise<AuthApiResultType> {
    const response = await this.auth.api.signOut({
      headers: input.headers,
      asResponse: true,
    });
    return toAuthApiResult(response);
  }
}
