import type { Tenant } from "./tenant";

/**
 * The badge IS the payment (owner-locked business model): every tenant site
 * footer carries "Powered by Aspira" linking to the matching gateway page on
 * aspira.study with the tenant's partner code for referral attribution.
 * Gateway pages are built by the Aspira session (bus row #44); URL contract:
 *   schools → /schools-web, agencies → /agencies-web,
 *   centers → /centers-web, teachers/influencers → /teachers-web (later tiers
 *   fall back to the aspira.study root until those pages ship).
 */
const GATEWAY_PATHS: Record<Tenant["type"], string> = {
  school: "/schools-web",
  agency: "/agencies-web",
  language_center: "", // /centers-web once live
  teacher: "", // /teachers-web once live
  influencer: "",
};

export function badgeUrl(tenant: Tenant, locale: string): string {
  const base = `https://www.aspira.study${GATEWAY_PATHS[tenant.type] ?? ""}`;
  const params = new URLSearchParams({ utm_source: "aspira-web", locale });
  if (tenant.partner_code) params.set("ref", tenant.partner_code);
  return `${base}?${params.toString()}`;
}
