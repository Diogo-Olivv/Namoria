"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Signs the user in on the SERVER so the Supabase session is written as
 * httpOnly cookies (see `authCookieOptions`), keeping tokens away from JS/XSS.
 * Returns an error message on failure; the caller handles navigation.
 */
export async function login(credentials: {
  email: string;
  password: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  return { error: error?.message ?? null };
}

/** Signs the user out on the server, clearing the httpOnly session cookies. */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
