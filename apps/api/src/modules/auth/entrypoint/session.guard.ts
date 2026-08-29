import {
  type CanActivate,
  type ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { CodedException } from '../../../errors/coded-exception.js';
import { IS_PUBLIC_KEY } from '../../../http/public.decorator.js';
import { GetSessionUseCase } from '../application/get-session.use-case.js';

// auth.md rules 11-13: one guard, applied globally (see AuthModule's APP_GUARD),
// reading the session through the single GetSessionUseCase caller. A route opts
// out with @Public(). auth.md rule 20: the authenticated user id is put on the
// request so a use case can take it as an input.
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly getSession: GetSessionUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // The socket handshake has its own session check (task 05); this guard is
    // HTTP-only.
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else if (value !== undefined) {
        headers.append(key, value);
      }
    }

    const { user } = await this.getSession.execute({ headers });
    if (!user) {
      throw new CodedException(
        'NO_SESSION',
        'Sign in to continue.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    (request as FastifyRequest & { userId: string }).userId = user.id;
    return true;
  }
}
