import {
  HttpStatus,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { ERROR_CODES } from '@gomide/contracts';

import { CodedException } from '../../../errors/coded-exception.js';

// stack-api.md rule 39 / auth.md rule 17 / FR.5.1: one guard on POST
// auth/sign-in carrying two keys — the source address and the submitted e-mail.
// Sign-up, sign-out and the session read carry no rate limit.
//
// As built: stack-api.md rule 39 names `@nestjs/throttler`, but 6.5.0 (its
// latest) is CJS-only, peers `@nestjs/common` `<=11`, and its `require()` of
// NestJS 12's ESM `@nestjs/common` throws a `require(esm)` cycle under Jest's
// `--experimental-vm-modules` loader — every integration suite fails to load.
// The rule's own case for the package is "fewer moving parts", so this is one
// in-process sliding-window guard of ours: no dependency, one store, one
// window, two keys, and it runs everywhere.
//
// FR.5.3: the counters live in this guard instance's memory, correct only while
// stack-api.md rule 24's single process holds. A second process needs shared
// storage first — see auth.md's Known gaps.

export const SIGN_IN_WINDOW_MS = 60_000;
// Deliberately tight: sign-in is the one lock on a door whose key is an unlisted
// URL (auth.md rule 17).
export const SIGN_IN_IP_LIMIT = 10;
export const SIGN_IN_EMAIL_LIMIT = 5;

const addressOf = (req: { ip?: unknown }): string =>
  typeof req.ip === 'string' && req.ip.length > 0 ? req.ip : 'unknown';

// task 04 AC4: the e-mail tracker reads the submitted e-mail and falls back to
// the source address when the body carries none.
export const emailTracker = (req: { ip?: unknown; body?: unknown }): string => {
  const body = req.body as { email?: unknown } | undefined;
  if (typeof body?.email === 'string' && body.email.length > 0) {
    return `email:${body.email.trim().toLowerCase()}`;
  }
  return `addr:${addressOf(req)}`;
};

// gotcha 34: with Fastify's trustProxy on (bootstrap.ts) this is the forwarded
// client address, not the proxy.
export const addressTracker = (req: { ip?: unknown }): string =>
  `addr:${addressOf(req)}`;

type KeySpec = { key: string; limit: number };

// architecture-api.md rules 39-40: a refusal is the project's error body
// carrying TOO_MANY_ATTEMPTS — one code, one shape.
@Injectable()
export class SignInRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const now = Date.now();

    const specs: KeySpec[] = [
      { key: addressTracker(req), limit: SIGN_IN_IP_LIMIT },
      { key: emailTracker(req), limit: SIGN_IN_EMAIL_LIMIT },
    ];

    // Record the attempt against every key, then refuse if any key is over.
    let refused = false;
    for (const { key, limit } of specs) {
      const recent = (this.hits.get(key) ?? []).filter(
        (at) => now - at < SIGN_IN_WINDOW_MS,
      );
      recent.push(now);
      this.hits.set(key, recent);
      if (recent.length > limit) refused = true;
    }

    if (refused) {
      throw new CodedException(
        ERROR_CODES.TOO_MANY_ATTEMPTS,
        'Too many attempts. Wait a moment and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
