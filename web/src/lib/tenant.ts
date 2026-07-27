import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "./db";

/**
 * Caching (ecosystem playbook, bus row #54): every read below goes through
 * the Next data cache tagged `tenant:{slug}` with a 5-min TTL fallback.
 * CMS/pipeline writes MUST call revalidateTag(tenantTag(slug)) so tenant
 * pages regenerate only when their content actually changes (Layer 1/2).
 * Migration to `cacheComponents` + "use cache" is planned with the template
 * design sprint — keep tags identical when that lands.
 */
export function tenantTag(slug: string): string {
  return `tenant:${slug}`;
}

const CACHE_TTL_SECONDS = 300;

export type TenantType = "school" | "agency" | "language_center" | "teacher" | "influencer";
export type TenantStatus = "draft" | "generating" | "review" | "live" | "suspended";

/** Trilingual value: keys are locale codes (uz/tg/ky + ru + en). */
export type L10n = Record<string, string>;

export interface Tenant {
  id: string;
  slug: string;
  type: TenantType;
  template: "school" | "agency" | "center" | "teacher_card" | "linkbio";
  name: string;
  city: string | null;
  country: "uz" | "tj" | "kg";
  locales: string[];
  default_locale: string;
  brand: { primary?: string; accent?: string; logo_url?: string };
  contact: { phone?: string; address?: L10n; telegram?: string; instagram?: string };
  partner_code: string | null;
  status: TenantStatus;
}

export interface Post {
  id: string;
  kind: "news" | "achievement" | "announcement";
  title: L10n;
  body: L10n;
  cover_url: string | null;
  published_at: string | null;
}

export interface Section {
  id: string;
  page: string;
  kind: string;
  position: number;
  content: Record<string, unknown>;
  visible: boolean;
}

export const getTenant = cache(async (slug: string): Promise<Tenant | null> => {
  const cached = unstable_cache(
    async (): Promise<Tenant | null> => {
      const { data, error } = await db()
        .from("vitrina_tenants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw new Error(`tenant lookup failed: ${error.message}`);
      if (!data || data.status === "suspended") return null;
      return data as Tenant;
    },
    ["vitrina-tenant", slug],
    { tags: [tenantTag(slug)], revalidate: CACHE_TTL_SECONDS }
  );
  return cached();
});

export const getSections = cache(async (tenant: Tenant, page: string): Promise<Section[]> => {
  const cached = unstable_cache(
    async (): Promise<Section[]> => {
      const { data, error } = await db()
        .from("vitrina_sections")
        .select("id, page, kind, position, content, visible")
        .eq("tenant_id", tenant.id)
        .eq("page", page)
        .eq("visible", true)
        .order("position");
      if (error) throw new Error(`sections lookup failed: ${error.message}`);
      return (data ?? []) as Section[];
    },
    ["vitrina-sections", tenant.id, page],
    { tags: [tenantTag(tenant.slug)], revalidate: CACHE_TTL_SECONDS }
  );
  return cached();
});

export async function getPosts(tenant: Tenant, kind?: Post["kind"], limit = 12): Promise<Post[]> {
  const cached = unstable_cache(
    async (): Promise<Post[]> => {
      let q = db()
        .from("vitrina_posts")
        .select("id, kind, title, body, cover_url, published_at")
        .eq("tenant_id", tenant.id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(limit);
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw new Error(`posts lookup failed: ${error.message}`);
      return (data ?? []) as Post[];
    },
    ["vitrina-posts", tenant.id, kind ?? "all", String(limit)],
    { tags: [tenantTag(tenant.slug)], revalidate: CACHE_TTL_SECONDS }
  );
  return cached();
}

export async function getPost(tenant: Tenant, id: string): Promise<Post | null> {
  const cached = unstable_cache(
    async (): Promise<Post | null> => {
      const { data, error } = await db()
        .from("vitrina_posts")
        .select("id, kind, title, body, cover_url, published_at")
        .eq("tenant_id", tenant.id)
        .eq("id", id)
        .not("published_at", "is", null)
        .maybeSingle();
      if (error) throw new Error(`post lookup failed: ${error.message}`);
      return (data as Post) ?? null;
    },
    ["vitrina-post", tenant.id, id],
    { tags: [tenantTag(tenant.slug)], revalidate: CACHE_TTL_SECONDS }
  );
  return cached();
}

/** Resolve the effective locale for a request ("_" = tenant default). */
export function resolveLocale(tenant: Tenant, raw: string): string | null {
  if (raw === "_") return tenant.default_locale;
  return tenant.locales.includes(raw) ? raw : null;
}

/** Pick a localized string with graceful fallback (locale → default → ru → en → any). */
export function pick(value: L10n | undefined | null, locale: string, fallback = ""): string {
  if (!value) return fallback;
  for (const key of [locale, "ru", "en"]) {
    const v = value[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  const first = Object.values(value).find((v) => typeof v === "string" && v.length > 0);
  return (first as string) ?? fallback;
}

/** Locale-prefixed path on the tenant's own domain (default locale is unprefixed). */
export function localePath(tenant: Tenant, locale: string, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === tenant.default_locale ? clean : `/${locale}${clean === "/" ? "" : clean}`;
}
