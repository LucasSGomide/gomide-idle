// The one error-code vocabulary (architecture-api.md rule 39): every `code` a
// route or a socket reply can carry is declared here, so the web writes one
// error switch regardless of transport. A new code is added here before it is
// thrown.
//
// naming.md rule 15: a code is SCREAMING_SNAKE_CASE naming the *situation*, never
// the HTTP status — EMAIL_TAKEN, not CONFLICT or error409. The status is already
// on the response.

export const ERROR_CODES = {
  // Fallback for anything not sorted into an expected category — always a 500,
  // and the body never carries a stack trace or a driver detail.
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  // A request body / query / param that failed its schema.
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  // Auth (roadmap item 03). Declared here before being thrown: EMAIL_TAKEN and
  // INVALID_CREDENTIALS in task 02's controller, TOO_MANY_ATTEMPTS in task 04's
  // throttler, REGISTRATION_CLOSED in task 03's sign-up guard.
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
} as const;

export type ErrorCodeType = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const SCREAMING_SNAKE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

// The HTTP status names (and their spellings) a code must never simply repeat.
const HTTP_STATUS_NAMES = new Set([
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'PAYMENT_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'NOT_ACCEPTABLE',
  'REQUEST_TIMEOUT',
  'CONFLICT',
  'GONE',
  'PAYLOAD_TOO_LARGE',
  'URI_TOO_LONG',
  'UNSUPPORTED_MEDIA_TYPE',
  'UNPROCESSABLE_ENTITY',
  'TOO_MANY_REQUESTS',
  'INTERNAL_SERVER_ERROR',
  'NOT_IMPLEMENTED',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
]);

export class ErrorCodeConventionError extends Error {
  constructor(code: string, reason: string) {
    super(`Invalid error code "${code}": ${reason}`);
    this.name = 'ErrorCodeConventionError';
  }
}

// architecture-api.md rule 39 / naming.md rule 15. Throws when a code names an
// HTTP status rather than a situation, or is not SCREAMING_SNAKE_CASE.
export function assertSituationCode(code: string): void {
  if (!SCREAMING_SNAKE.test(code)) {
    throw new ErrorCodeConventionError(code, 'not SCREAMING_SNAKE_CASE');
  }
  if (HTTP_STATUS_NAMES.has(code)) {
    throw new ErrorCodeConventionError(
      code,
      'names an HTTP status, not a situation',
    );
  }
  if (/^(?:HTTP_?)?E?_?\d{3}$/i.test(code) || /^ERROR_?\d+$/i.test(code)) {
    throw new ErrorCodeConventionError(
      code,
      'names an HTTP status number, not a situation',
    );
  }
}

export function isSituationCode(code: string): boolean {
  try {
    assertSituationCode(code);
    return true;
  } catch {
    return false;
  }
}
