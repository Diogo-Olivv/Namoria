import "server-only";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolves the Supabase client + authenticated user for a Route Handler.
 * Returns `null` when there is no valid session so callers can 401 uniformly.
 */
export async function requireUser(): Promise<{
  supabase: SupabaseClient;
  user: User;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}
