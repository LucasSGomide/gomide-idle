import { createZodDto } from 'nestjs-zod';

import {
  signInRequestSchema,
  signInResponseSchema,
  signOutResponseSchema,
  sessionResponseSchema,
  signUpRequestSchema,
  signUpResponseSchema,
} from '@gomide/contracts';

// nestjs-zod bridges each libs/contracts schema into a class @nestjs/swagger
// documents. Roadmap 01's As built: no top-level `.meta({ id })` on a schema
// wrapped by createZodDto — the class name is the component name, and
// cleanupOpenApiDoc hoists the referenced `AuthUser` schema on its own
// (stack-api.md rule 47, FR.11.4).
export class SignUpRequest extends createZodDto(signUpRequestSchema) {}
export class SignUpResponse extends createZodDto(signUpResponseSchema) {}
export class SignInRequest extends createZodDto(signInRequestSchema) {}
export class SignInResponse extends createZodDto(signInResponseSchema) {}
export class SignOutResponse extends createZodDto(signOutResponseSchema) {}
export class SessionResponse extends createZodDto(sessionResponseSchema) {}
