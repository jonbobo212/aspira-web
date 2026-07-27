import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Admin access v1 (pilot): token-gated links, same pattern as Aspira's
 * class-board tokens. Each tenant's admin URL is
 *   https://{slug}.aspira.study/admin?t={adminToken(slug)}
 * derived from VITRINA_ADMIN_SECRET — no user accounts needed for Phase 0.
 * Phase 1 replaces this with Supabase-auth members via vitrina_admins
 * (schema + RLS already in place).
 */
function secret(): string {
  const s = process.env.VITRINA_ADMIN_SECRET;
  if (!s) throw new Error("VITRINA_ADMIN_SECRET not configured");
  return s;
}

export function adminToken(slug: string): string {
  return createHmac("sha256", secret()).update(`admin:${slug}`).digest("hex").slice(0, 32);
}

export function verifyAdminToken(slug: string, token: string | undefined | null): boolean {
  if (!token || !process.env.VITRINA_ADMIN_SECRET) return false;
  const expected = Buffer.from(adminToken(slug));
  const given = Buffer.from(token.slice(0, 64));
  return expected.length === given.length && timingSafeEqual(expected, given);
}
