import { Inject, Injectable } from '@nestjs/common';

import { AUTH_INSTANCE, type AuthInstanceType } from '../auth.tokens.js';
import {
  toAuthApiResult,
  type AuthApiResultType,
} from './auth-api-result.type.js';

export type SignInInputType = {
  email: string;
  password: string;
  headers: Headers;
};

@Injectable()
export class SignInUseCase {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstanceType) {}

  async execute(input: SignInInputType): Promise<AuthApiResultType> {
    const response = await this.auth.api.signInEmail({
      body: { email: input.email, password: input.password },
      headers: input.headers,
      asResponse: true,
    });
    return toAuthApiResult(response);
  }
}
