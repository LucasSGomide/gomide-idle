import { HttpStatus, InternalServerErrorException } from '@nestjs/common';

import { ERROR_CODES } from '@gomide/contracts';

import { CodedException } from '../../../errors/coded-exception.js';
import type { AuthApiResultType } from '../application/auth-api-result.type.js';

// architecture-api.md rules 39-40 / auth.md rule 27: Better Auth's own error
// string is translated into one `code` from the single vocabulary here, at the
// edge, so the web renders it from the code like any other error and never sees
// the library's English message.
export function translateAuthError(result: AuthApiResultType): Error {
  const code =
    typeof (result.body as { code?: unknown } | undefined)?.code === 'string'
      ? (result.body as { code: string }).code
      : '';

  switch (code) {
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return new CodedException(
        ERROR_CODES.EMAIL_TAKEN,
        'That address already has an account.',
        HttpStatus.CONFLICT,
      );
    case 'INVALID_EMAIL_OR_PASSWORD':
      return new CodedException(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Wrong e-mail or password.',
        HttpStatus.UNAUTHORIZED,
      );
    default:
      // An unmapped library failure is a 500 in the project's shape, never the
      // library's message forwarded verbatim.
      return new InternalServerErrorException('auth: unmapped provider error');
  }
}
