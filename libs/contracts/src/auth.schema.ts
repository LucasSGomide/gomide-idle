import { z } from 'zod';

// FR.11.1: libs/contracts is the single source for every auth payload — request
// validation on the server, the OpenAPI document Orval reads, and the generated
// web client. auth.md rule 19 (reversed 2026-08-29): the auth routes are in the
// document like every other route.
//
// stack-api.md rule 47 / FR.11.4: every reusable schema is a named component.
// Roadmap 01's As built found that a top-level `.meta({ id })` passed straight
// into `createZodDto` collides with `cleanupOpenApiDoc`'s own hoist, so the
// request/response schemas carry none — their nestjs-zod DTO class name is the
// component name. Only `authUserSchema`, which is referenced rather than wrapped
// in a DTO, carries a `.meta({ id })`, the way socket.schema.ts does.

// FR.1.3: the password bound is pinned at 8-128 (auth.md rule 31), matched to
// the Better Auth instance (auth.options.ts).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const authUserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
  })
  .meta({ id: 'AuthUser' });

export type AuthUserType = z.infer<typeof authUserSchema>;

export const signUpRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});
export const SIGN_UP_REQUEST_SCHEMA_ID = 'SignUpRequest';
export type SignUpRequestType = z.infer<typeof signUpRequestSchema>;

export const signUpResponseSchema = z.object({ user: authUserSchema });
export const SIGN_UP_RESPONSE_SCHEMA_ID = 'SignUpResponse';
export type SignUpResponseType = z.infer<typeof signUpResponseSchema>;

// Sign-in does not re-impose the creation bound: a stored password predates any
// later change to it, and the only question here is whether the pair matches.
export const signInRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const SIGN_IN_REQUEST_SCHEMA_ID = 'SignInRequest';
export type SignInRequestType = z.infer<typeof signInRequestSchema>;

export const signInResponseSchema = z.object({ user: authUserSchema });
export const SIGN_IN_RESPONSE_SCHEMA_ID = 'SignInResponse';
export type SignInResponseType = z.infer<typeof signInResponseSchema>;

export const signOutResponseSchema = z.object({ success: z.literal(true) });
export const SIGN_OUT_RESPONSE_SCHEMA_ID = 'SignOutResponse';
export type SignOutResponseType = z.infer<typeof signOutResponseSchema>;

// FR.2.1: the session is a server-side row read from the cookie. `user` is null
// when there is no session, so a signed-out caller gets a 200 with a null body
// rather than a 401 (GET auth/session is public — task 03).
//
// FR.5.2 / auth.md rule 18: `registrationOpen` is reported here both signed in
// and signed out, so the web hides the sign-up link rather than guessing at it.
export const sessionResponseSchema = z.object({
  user: authUserSchema.nullable(),
  registrationOpen: z.boolean(),
});
export const SESSION_RESPONSE_SCHEMA_ID = 'SessionResponse';
export type SessionResponseType = z.infer<typeof sessionResponseSchema>;
