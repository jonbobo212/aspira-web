import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client, server only. Rendering goes through this (RLS bypassed)
 * so draft/review tenants can be previewed server-gated; the anon key + RLS
 * protect everything reachable from the browser.
 */
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      // Lazy construction on purpose — a missing env must fail the request,
      // never the build (module-scope SDK constructors broke Aplify's preview builds).
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured");
    }
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
