import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_CODES } from '@gomide/contracts';

export type NormalisedErrorType = {
  statusCode: number;
  code: string;
  message: string;
  children?: unknown[];
};

function stringifyMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' ? message : JSON.stringify(message);
}

// The single mapping from a thrown exception to a { code, message } pair, used by
// both the HTTP filter and its socket twin — so the same error carries the same
// `code` on either transport (architecture-api.md rules 37, 45). An expected
// error carries its own code; anything else is a 500 / INTERNAL_ERROR with no
// stack trace and no driver detail.
export function normaliseError(exception: unknown): NormalisedErrorType {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    const carried =
      typeof response === 'object' && response !== null
        ? (response as Record<string, unknown>)
        : {};
    return {
      statusCode: status,
      code:
        typeof carried.code === 'string'
          ? carried.code
          : ERROR_CODES.INTERNAL_ERROR,
      message:
        'message' in carried
          ? stringifyMessage(carried.message)
          : exception.message,
      ...(Array.isArray(carried.children)
        ? { children: carried.children }
        : {}),
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Internal server error',
  };
}
