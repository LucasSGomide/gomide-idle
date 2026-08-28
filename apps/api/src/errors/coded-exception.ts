import { HttpException, type HttpStatus } from '@nestjs/common';

import { assertSituationCode } from '@gomide/contracts';

// An expected error (architecture-api.md rule 37): a NestJS HttpException
// subclass carrying a machine-readable `code`. The code is checked against
// naming.md rule 15 at construction, so a code that names an HTTP status rather
// than a situation fails fast rather than reaching the wire.
export class CodedException extends HttpException {
  readonly code: string;

  constructor(code: string, message: string, status: HttpStatus) {
    assertSituationCode(code);
    super({ code, message }, status);
    this.code = code;
  }
}
