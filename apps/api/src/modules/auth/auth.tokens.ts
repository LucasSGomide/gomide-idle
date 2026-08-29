// naming.md rule 12: an injection token is SCREAMING_SNAKE_CASE. The Better Auth
// instance has no port — it is the library object itself — so the token is named
// for what it holds. It lives at the module root rather than in infrastructure/
// because the entrypoint controllers inject it (auth.md rule 2) and
// architecture-api.md rule 19 keeps entrypoint/ from importing infrastructure/.
export const AUTH_INSTANCE = Symbol('AUTH_INSTANCE');
