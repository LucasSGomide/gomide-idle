// architecture-web.md rule 11 / FR.14.3: the one file the generated client
// calls. It holds the relative base path and `credentials` and nothing about
// the host — the deployment serves the web files and the API from one origin,
// so `/api` is a relative path and no base URL is ever compiled in.

export const API_BASE_PATH = '/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { code?: unknown; message?: unknown };

/**
 * The machine-readable `code` for a thrown request error, for
 * architecture-web.md rule 27's catalogue lookup. Anything that is not an
 * `ApiError` (a network drop, a parse failure) reads as INTERNAL_ERROR.
 */
export function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
}

// Orval's fetch client expects the mutator to resolve to this envelope.
type FetchEnvelope<T> = { status: number; data: T; headers: Headers };

/**
 * Orval's fetch mutator. Every generated request passes through here, so the
 * base path, `credentials` and the error shape are configured exactly once.
 */
export async function fetcher<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_PATH}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const errorBody = (body ?? {}) as ErrorBody;
    // architecture-web.md rule 27: the client keeps the machine-readable `code`
    // and never renders the server's `message`.
    throw new ApiError(
      response.status,
      typeof errorBody.code === 'string' ? errorBody.code : 'INTERNAL_ERROR',
      typeof errorBody.message === 'string'
        ? errorBody.message
        : response.statusText,
    );
  }

  const envelope: FetchEnvelope<unknown> = {
    status: response.status,
    data: body,
    headers: response.headers,
  };
  return envelope as T;
}
