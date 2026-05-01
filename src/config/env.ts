import { z } from 'zod';

// Treat empty strings as undefined for optional vars (common when .env keys exist but are blank)
const optionalNonEmpty = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => (v === '' || v === undefined ? undefined : v), schema.optional());

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SENTRY_DSN: optionalNonEmpty(z.string().url()),
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty(z.string().min(20)),
  DOLARAPI_BASE_URL: z.string().url().default('https://dolarapi.com/v1'),
  RESEND_API_KEY: optionalNonEmpty(z.string().min(20)),
  APP_URL: z.string().url().default('http://localhost:3000'),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

function parseEnv(): ServerEnv {
  const result = ServerEnvSchema.safeParse(process.env);
  if (!result.success) {
    const isBuild = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuild) {
      console.warn(
        '[env] Validation skipped during production build:',
        result.error.flatten().fieldErrors,
      );
      return {
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder_anon_key_value_x'.padEnd(20, 'x'),
        DOLARAPI_BASE_URL: 'https://dolarapi.com/v1',
        APP_URL: 'http://localhost:3000',
      } as ServerEnv;
    }
    console.error('[env] Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return result.data;
}

export const env = parseEnv();
