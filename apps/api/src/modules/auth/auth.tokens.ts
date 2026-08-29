// naming.md rule 12: an injection token is SCREAMING_SNAKE_CASE. The Better Auth
// instance has no port — it is the library object itself — so the token is named
// for what it holds. This file sits at the module root rather than in a layer
// folder because both application/ use cases and entrypoint/ controllers depend
// on it, and architecture-api.md rule 19 forbids either of them importing
// infrastructure/ where the instance is built.
export { type AuthInstanceType } from './infrastructure/auth.instance.js';

export const AUTH_INSTANCE = Symbol('AUTH_INSTANCE');
