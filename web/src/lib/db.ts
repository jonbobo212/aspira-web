import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client. Preferred: service role (RLS bypassed) so
 * draft/review tenants can be previewed server-gated. Fallback when the
 * service key env is absent (e.g. a fresh preview deployment): the
 * PUBLISHABLE key — safe to ship in code by design; RLS then applies, so
 * only live tenants' content renders and constrained lead INSERTs work,
 * while admin/pipeline writes are inert until real envs are set.
 */
const DEFAULT_URL = "https://mywdtmimiazeyhfdtqlw.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_vKgfcMdSqFwO0L6jEofMkQ_lKraii8s";

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    // Lazy construction on purpose — env problems must fail the request,
    // never the build (module-scope SDK constructors broke Aplify's preview builds).
    const url = process.env.SUPABASE_URL ?? DEFAULT_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? PUBLISHABLE_KEY;
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
