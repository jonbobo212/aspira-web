import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant, resolveLocale, localePath } from "@/lib/tenant";
import { ui, LOCALE_NAMES } from "@/lib/ui-strings";
import { badgeUrl } from "@/lib/badge";

interface Params {
  slug: string;
  locale: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, locale: rawLocale } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return {};
  const locale = resolveLocale(tenant, rawLocale);
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    // Draft/review sites stay out of search indexes until flipped live.
    robots: tenant.status === "live" ? undefined : { index: false, follow: false },
    other: locale ? { "content-language": locale } : undefined,
  };
}

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { slug, locale: rawLocale } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  const locale = resolveLocale(tenant, rawLocale);
  if (!locale) notFound();
  const t = ui(locale);

  const brandStyle = {
    "--brand": tenant.brand.primary ?? "#0f4c81",
    "--brand-accent": tenant.brand.accent ?? "#f4c430",
  } as React.CSSProperties;

  const nav = [
    { href: "/", label: t.home },
    { href: "/news", label: t.news },
    { href: "/contact", label: t.contact },
  ];

  return (
    <div style={brandStyle} className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href={localePath(tenant, locale)} className="flex items-center gap-3">
            {tenant.brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.brand.logo_url} alt="" className="h-9 w-9 rounded object-contain" />
            ) : null}
            <span className="font-semibold text-brand">{tenant.name}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={localePath(tenant, locale, item.href)} className="hover:text-brand">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl gap-3 px-4 py-1.5 text-xs text-muted">
          {tenant.locales.map((code) => (
            <Link
              key={code}
              href={localePath(tenant, code)}
              className={code === locale ? "font-semibold text-brand" : "hover:text-brand"}
            >
              {LOCALE_NAMES[code] ?? code}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1">{children}</main>

      <footer className="mt-12 border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} {tenant.name}</span>
          {/* The badge is the contract: every gifted site links to the Aspira gateway. */}
          <a
            href={badgeUrl(tenant, locale)}
            className="rounded border border-line px-3 py-1.5 font-medium text-brand hover:border-brand"
          >
            {t.poweredBy}
          </a>
        </div>
      </footer>
    </div>
  );
}
