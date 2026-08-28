import { HttpException, type HttpStatus } from '@nestjs/common';

import { assertSituationCode } from '@gomide/contracts';

// An expected error (architecture-api.md rule 37): a NestJS HttpException
// subclass carrying a machine-readable `code`. The same exception is thrown on
// either transport — the HTTP filter renders it with a status, the socket filter
// renders it without one (rule 45). The code is checked against naming.md
// rule 15 at construction.
export class CodedException extends HttpException {
  readonly code: string;

  constructor(
    code: string,
    message: string,
    status: HttpStatus,
    children?: unknown[],
  ) {
    assertSituationCode(code);
    super({ code, message, ...(children ? { children } : {}) }, status);
    this.code = code;
  }
}
