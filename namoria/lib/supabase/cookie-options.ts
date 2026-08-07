/**
 * Hardened cookie options for the Supabase auth session.
 *
 * `httpOnly` keeps the access/refresh tokens out of reach of client-side JS,
 * which neutralises token theft via XSS. This REQUIRES auth to run on the
 * server (see the login/logout Server Actions) — the browser Supabase client
 * cannot read httpOnly cookies, so it must not be used for the session.
 */
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
