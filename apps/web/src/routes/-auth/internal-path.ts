// architecture-web.md rule 27's cousin: a `redirect` search param is validated
// as an internal path, never trusted, so it cannot become an open redirect.
// Anything that is not a same-origin absolute path falls back to /characters.
export function toInternalPath(value: unknown): string {
  if (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/^\/[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return value;
  }
  return '/characters';
}
