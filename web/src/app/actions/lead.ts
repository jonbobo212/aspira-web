"use server";

import { db } from "@/lib/db";
import { getTenant } from "@/lib/tenant";

export interface LeadState {
  ok: boolean | null;
  error?: string;
}

/**
 * Public lead form submit. Stored locally in vitrina_leads; forwarding into
 * Aplify (agency sites, with the tenant's agency_code) is the pipeline's next
 * step and stamps forwarded_at — see docs/ASPIRA_WEB_PLAN.md §6.
 */
export async function submitLead(prev: LeadState, formData: FormData): Promise<LeadState> {
  const slug = String(formData.get("tenant") ?? "").slice(0, 63);
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 32);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  const locale = String(formData.get("locale") ?? "").slice(0, 5);
  const sourcePage = String(formData.get("source_page") ?? "").slice(0, 200);
  // Honeypot: real users never fill this field.
  if (formData.get("website")) return { ok: true };

  if (!name || phone.replace(/\D/g, "").length < 7) {
    return { ok: false, error: "invalid" };
  }

  const tenant = await getTenant(slug);
  if (!tenant) return { ok: false, error: "unknown tenant" };

  const { error } = await db().from("vitrina_leads").insert({
    tenant_id: tenant.id,
    name,
    phone,
    message: message || null,
    locale: locale || null,
    source_page: sourcePage || null,
  });
  if (error) return { ok: false, error: "db" };
  return { ok: true };
}
