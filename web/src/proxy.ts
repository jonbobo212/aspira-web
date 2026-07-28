import { NextRequest, NextResponse } from "next/server";

/**
 * Hostname → tenant routing. `{slug}.aspira.study/{path}` is rewritten to
 * `/t/{slug}/{locale}/{path}` so one deployment serves every tenant.
 * Locale is the first path segment when present; `_` means "tenant default"
 * (resolved server-side — the proxy stays DB-free).
 *
 * Dev/preview without a wildcard host: append `?__tenant={slug}`.
 * Custom domains land in Phase 1 (server-side lookup on vitrina_tenants.custom_domain).
 */
const LOCALES = ["uz", "ru", "en", "tg", "ky", "kk", "mn", "az", "uk"];

export default function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "aspira.study";

  let slug: string | null = null;
  for (const base of [root, "localhost"]) {
    if (host.endsWith(`.${base}`)) {
      const sub = host.slice(0, -(base.length + 1));
      if (sub && sub !== "www" && !sub.includes(".")) slug = sub;
      break;
    }
  }
  if (!slug) slug = url.searchParams.get("__tenant");
  if (!slug || url.pathname.startsWith("/t/") || url.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const segments = url.pathname.split("/").filter(Boolean);
  let locale = "_";
  let rest = segments;
  if (segments.length > 0 && LOCALES.includes(segments[0])) {
    locale = segments[0];
    rest = segments.slice(1);
  }

  const dest = url.clone();
  dest.pathname = `/t/${slug}/${locale}${rest.length ? `/${rest.join("/")}` : ""}`;
  dest.searchParams.delete("__tenant");
  return NextResponse.rewrite(dest);
}

export const config = {
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
