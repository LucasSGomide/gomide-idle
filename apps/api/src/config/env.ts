import { z } from 'zod';

// A committed .env.example line copied verbatim leaves KEY= (empty). Treat an
// empty optional variable as absent rather than as a malformed value.
const emptyAsUndefined = (value: unknown): unknown =>
  value === '' ? undefined : value;

// FR.14.1: every environment variable the system reads is declared here and
// validated at start-up. A missing or malformed value stops the process with the
// offending field named. New variables are added to this schema and to
// .env.example together — apps/api/test/env.spec.ts fails if they drift.
export const envSchema = z.object({
  // Required, no default: an operator must state the environment rather than
  // have the process guess one (UN.14).
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Postgres connection string. Required — a misconfigured deployment must fail
  // at start-up (UN.14). postgres.js connects lazily, so a placeholder is fine
  // in tests that never touch the database.
  DATABASE_URL: z.string().url(),

  // The running build's identifier, reported on the server_meta read path. A
  // build id fixed at migration time is stale on the next build (roadmap 01
  // open decision), so it comes from the environment and the seeded column is
  // only the fallback. Defaults to 'dev' for a local run.
  BUILD_ID: z.string().min(1).default('dev'),
  PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // FR.5.2 / auth.md rule 18: registration closes by configuration — new
  // sign-ups are refused with REGISTRATION_CLOSED while existing accounts keep
  // working. A string 'true' | 'false' because env values are strings; anything
  // else stops start-up (FR.14.1). Open by default.
  AUTH_REGISTRATION_OPEN: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  // stack-api.md rule 38 / FR.3.2: the socket handshake's Origin is checked
  // against this list on every connection (CORS does not govern the WebSocket
  // upgrade). Comma-separated; in development it holds the Vite dev origin
  // (stack-web.md rule 62's proxy is served from there). A request with no
  // Origin header — a native client, a same-origin call — is allowed.
  SOCKET_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),

  // Observability (stack-api.md rules 43-44, UN.21). The agent activates only
  // when BOTH credentials are present; development and CI leave them unset and it
  // then sends nothing at all (FR.21.2). See src/observability/observability.ts.
  OBSERVE_APP_KEY: z.preprocess(emptyAsUndefined, z.string().min(1).optional()),
  OBSERVE_APP_SECRET: z.preprocess(
    emptyAsUndefined,
    z.string().min(1).optional(),
  ),
  OBSERVE_SERVICE_ID: z.string().min(1).default('tormented-path-api'),
  OBSERVE_ENDPOINT: z.preprocess(emptyAsUndefined, z.url().optional()),
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
