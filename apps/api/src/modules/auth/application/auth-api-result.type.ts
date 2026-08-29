// naming.md rule 8: a data shape is `type FooType`. The normalised return of a
// Better Auth `auth.api.*` call made with `asResponse: true` — the library hands
// back a web `Response` for both success and failure, so a use case turns it
// into this and the controller decides the transport (copies `setCookie`,
// translates `body.code` on `!ok`). architecture-api.md rule 29 keeps the use
// case from building the Fastify reply itself.
export type AuthApiResultType = {
  ok: boolean;
  status: number;
  body: unknown;
  setCookie: string[];
};

export async function toAuthApiResult(
  response: Response,
): Promise<AuthApiResultType> {
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: text ? (JSON.parse(text) as unknown) : undefined,
    setCookie: response.headers.getSetCookie(),
  };
}
