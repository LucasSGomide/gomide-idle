import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  sessionResponseSchema,
  signInRequestSchema,
  signInResponseSchema,
  signOutResponseSchema,
  signUpRequestSchema,
  signUpResponseSchema,
  type SessionResponseType,
  type SignInResponseType,
  type SignOutResponseType,
  type SignUpResponseType,
} from '@gomide/contracts';

import { CodedException } from '../../../errors/coded-exception.js';
import { Public } from '../../../http/public.decorator.js';
import type { AuthApiResultType } from '../application/auth-api-result.type.js';
import { GetSessionUseCase } from '../application/get-session.use-case.js';
import { SignInUseCase } from '../application/sign-in.use-case.js';
import { SignOutUseCase } from '../application/sign-out.use-case.js';
import { SignUpUseCase } from '../application/sign-up.use-case.js';
import { translateAuthError } from './auth-error.js';
import { SignInRateLimitGuard } from './sign-in-throttle.js';
import {
  SessionResponse,
  SignInRequest,
  SignInResponse,
  SignOutResponse,
  SignUpRequest,
  SignUpResponse,
} from './dto/auth.dto.js';

// architecture-api.md rule 24: the entrypoint decides nothing. It parses the
// body shape (rule 26), calls the use case that owns the `auth.api` call
// (auth.md rule 3), copies the library's set-cookie onto the Fastify reply
// (auth.md gotcha 29) and maps the library's error to one `code` (rule 27).
//
// No `@Inject()` in this constructor: the OpenAPI generator boots in preview
// mode under tsx, which emits no `design:paramtypes`. A bare class-type param is
// left unresolved by preview mode (as it was before task 03); one explicit
// `@Inject` here would force Nest to resolve every param and fail on the others.
// Config the handlers need lives on the use cases instead.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUp: SignUpUseCase,
    private readonly signIn: SignInUseCase,
    private readonly signOut: SignOutUseCase,
    private readonly getSession: GetSessionUseCase,
  ) {}

  @Post('sign-up')
  @Public()
  @ApiBody({ type: SignUpRequest })
  @ApiCreatedResponse({ type: SignUpResponse })
  async postSignUp(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SignUpResponseType> {
    const input = parseBody(signUpRequestSchema, body);
    const result = await this.signUp.execute({
      email: input.email,
      password: input.password,
      headers: toHeaders(request),
    });
    return relay(result, reply, signUpResponseSchema);
  }

  @Post('sign-in')
  @Public()
  @UseGuards(SignInRateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: SignInRequest })
  @ApiOkResponse({ type: SignInResponse })
  async postSignIn(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SignInResponseType> {
    const input = parseBody(signInRequestSchema, body);
    const result = await this.signIn.execute({
      email: input.email,
      password: input.password,
      headers: toHeaders(request),
    });
    return relay(result, reply, signInResponseSchema);
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SignOutResponse })
  async postSignOut(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SignOutResponseType> {
    // The session guard ran (sign-out is not @Public) and put the session id on
    // the request; the use case publishes it so the socket registry can close
    // that session's connections (auth.md rule 33).
    const { sessionId } = request as FastifyRequest & {
      sessionId: string | null;
    };
    const result = await this.signOut.execute({
      headers: toHeaders(request),
      sessionId: sessionId ?? null,
    });
    return relay(result, reply, signOutResponseSchema);
  }

  @Get('session')
  @Public()
  @ApiOkResponse({ type: SessionResponse })
  async getCurrentSession(
    @Req() request: FastifyRequest,
  ): Promise<SessionResponseType> {
    const { user, registrationOpen } = await this.getSession.execute({
      headers: toHeaders(request),
    });
    // FR.5.2 / auth.md rule 18: the registration flag rides on the session read
    // both signed in and signed out, so the web hides the sign-up link.
    return sessionResponseSchema.parse({ user, registrationOpen });
  }
}

function parseBody<T>(
  schema: {
    safeParse: (value: unknown) => {
      success: boolean;
      data?: T;
      error?: { issues: unknown[] };
    };
  },
  body: unknown,
): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data === undefined) {
    throw new CodedException(
      'VALIDATION_FAILED',
      'The request body failed validation.',
      HttpStatus.BAD_REQUEST,
      parsed.error?.issues,
    );
  }
  return parsed.data;
}

function toHeaders(request: FastifyRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.append(key, value);
    }
  }
  return headers;
}

// The success status is the controller's own (@HttpCode / the @Post default),
// not whatever Better Auth's HTTP layer returned — architecture-api.md rule 24.
// On failure the CodedException from translateAuthError carries the status.
function relay<T>(
  result: AuthApiResultType,
  reply: FastifyReply,
  responseSchema: { parse: (value: unknown) => T },
): T {
  if (!result.ok) throw translateAuthError(result);
  if (result.setCookie.length > 0) {
    reply.header('set-cookie', result.setCookie);
  }
  return responseSchema.parse(result.body);
}
