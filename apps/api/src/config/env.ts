import { z } from 'zod';

// FR.14.1: every environment variable the system reads is declared here and
// validated at start-up. A missing or malformed value stops the process with the
// offending field named. New variables are added to this schema and to
// .env.example together — apps/api/test/env.spec.ts fails if they drift.
export const envSchema = z.object({
  // Required, no default: an operator must state the environment rather than
  // have the process guess one (UN.14).
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export type EnvType = z.infer<typeof envSchema>;

export const ENV_KEYS = Object.keys(envSchema.shape) as Array<keyof EnvType>;

export class EnvironmentError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    const detail = issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    super(`Invalid environment:\n${detail}`);
    this.name = 'EnvironmentError';
  }
}

export function loadEnv(
  source: Record<string, string | undefined> = process.env,
): EnvType {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvironmentError(parsed.error.issues);
  }
  return parsed.data;
}

// Injection token for the validated, frozen environment.
export const ENV = Symbol('ENV');
