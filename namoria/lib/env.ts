/**
 * Environment access with validation.
 *
 * - `publicEnv`  → NEXT_PUBLIC_* vars, safe on client and server.
 * - `serverEnv()` → server-only secrets (R2 creds, service role). Throws if any
 *   required var is missing. NEVER import the returned values into client code:
 *   this module reads `process.env` for secrets that only exist server-side.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Public vars — inlined by Next at build time, safe to use anywhere.
 * Validated lazily (on first client creation) so `next build` doesn't fail
 * when secrets aren't present in the build environment.
 */
export const publicEnv = {
  get supabaseUrl(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
  },
  get supabaseAnonKey(): string {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
};

export interface ServerEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2Endpoint: string;
}

let cachedServerEnv: ServerEnv | null = null;

/** Reads and validates all server-side secrets. Call only in server code. */
export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  cachedServerEnv = {
    supabaseUrl: required(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    supabaseAnonKey: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    supabaseServiceRoleKey: required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    r2AccountId: required("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID),
    r2AccessKeyId: required("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
    r2SecretAccessKey: required(
      "R2_SECRET_ACCESS_KEY",
      process.env.R2_SECRET_ACCESS_KEY,
    ),
    r2BucketName: required("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME),
    r2Endpoint: required("R2_ENDPOINT", process.env.R2_ENDPOINT),
  };

  return cachedServerEnv;
}
