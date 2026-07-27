"use server";

import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getTenant, tenantTag } from "@/lib/tenant";
import { verifyAdminToken } from "@/lib/admin-auth";
import { translateL10n } from "@/lib/translate";

export interface AdminActionState {
  ok: boolean | null;
  error?: string;
  translated?: boolean;
}

/**
 * CMS write path: save post in the editor's locale, auto-translate to the
 * tenant's other locales (Haiku through the shared AI cache), publish, and
 * revalidateTag so only this tenant's pages regenerate (caching contract).
 */
export async function createPost(
  prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const slug = String(formData.get("tenant") ?? "").slice(0, 63);
  const token = String(formData.get("token") ?? "");
  const kind = String(formData.get("kind") ?? "news");
  const locale = String(formData.get("locale") ?? "").slice(0, 5);
  const title = String(formData.get("title") ?? "").trim().slice(0, 300);
  const body = String(formData.get("body") ?? "").trim().slice(0, 20000);

  if (!verifyAdminToken(slug, token)) return { ok: false, error: "auth" };
  if (!["news", "achievement", "announcement"].includes(kind)) {
    return { ok: false, error: "invalid" };
  }
  if (!title || !body) return { ok: false, error: "invalid" };

  const tenant = await getTenant(slug);
  if (!tenant) return { ok: false, error: "unknown tenant" };
  const sourceLocale = tenant.locales.includes(locale) ? locale : tenant.default_locale;

  let translated = false;
  let titleValue: Record<string, string> = { [sourceLocale]: title };
  let bodyValue: Record<string, string> = { [sourceLocale]: body };
  let machineLocales: string[] = [];
  try {
    const [t, b] = await Promise.all([
      translateL10n(titleValue, sourceLocale, tenant.locales),
      translateL10n(bodyValue, sourceLocale, tenant.locales),
    ]);
    titleValue = t.value;
    bodyValue = b.value;
    machineLocales = Array.from(new Set([...t.machineLocales, ...b.machineLocales]));
    translated = machineLocales.length > 0;
  } catch {
    // Translation failure must never block publishing — post goes out in the
    // source locale; machine_locales stays empty so a backfill can finish it.
  }

  const { error } = await db().from("vitrina_posts").insert({
    tenant_id: tenant.id,
    kind,
    title: titleValue,
    body: bodyValue,
    machine_locales: machineLocales,
    published_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "db" };

  revalidateTag(tenantTag(slug), { expire: 0 });
  return { ok: true, translated };
}

export async function deletePost(
  prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const slug = String(formData.get("tenant") ?? "").slice(0, 63);
  const token = String(formData.get("token") ?? "");
  const id = String(formData.get("id") ?? "");

  if (!verifyAdminToken(slug, token)) return { ok: false, error: "auth" };
  const tenant = await getTenant(slug);
  if (!tenant) return { ok: false, error: "unknown tenant" };

  const { error } = await db()
    .from("vitrina_posts")
    .delete()
    .eq("tenant_id", tenant.id)
    .eq("id", id);
  if (error) return { ok: false, error: "db" };

  revalidateTag(tenantTag(slug), { expire: 0 });
  return { ok: true };
}
