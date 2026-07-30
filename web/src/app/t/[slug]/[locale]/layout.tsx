import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant, resolveLocale, localePath } from "@/lib/tenant";
import { ui, LOCALE_NAMES } from "@/lib/ui-strings";
import { badgeUrl } from "@/lib/badge";
import { ScrollProgress } from "@/components/motion/progress-bar";

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
      <ScrollProgress />

      <header className="sticky top-0 z-40 border-b border-line/70 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href={localePath(tenant, locale)} className="flex items-center gap-3">
            {tenant.brand.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.brand.logo_url} alt="" className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--brand), color-mix(in srgb, var(--brand) 60%, var(--brand-accent)))" }}
              >
                {tenant.name.charAt(0)}
              </span>
            )}
            <span className="font-semibold tracking-tight text-brand">{tenant.name}</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={localePath(tenant, locale, item.href)}
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-brand/5 hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="border-b border-line/60 bg-white/60">
        <div className="mx-auto flex max-w-5xl gap-1.5 px-4 py-1.5 text-xs">
          {tenant.locales.map((code) => (
            <Link
              key={code}
              href={localePath(tenant, code)}
              className={
                code === locale
                  ? "rounded-full bg-brand px-2.5 py-0.5 font-medium text-white"
                  : "rounded-full px-2.5 py-0.5 text-muted transition-colors hover:bg-brand/10 hover:text-brand"
              }
            >
              {LOCALE_NAMES[code] ?? code}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 bg-ink text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="font-semibold">{tenant.name}</p>
            <p className="mt-1 text-white/60">
              © {new Date().getFullYear()}
              {tenant.city ? ` · ${tenant.city}` : ""}
            </p>
          </div>
          {/* The badge is the contract: every gifted site links to the Aspira gateway. */}
          <a
            href={badgeUrl(tenant, locale)}
            className="btn-shiny rounded-full border border-white/20 bg-white/10 px-4 py-2 font-medium text-white transition-colors hover:bg-white/20"
          >
            {t.poweredBy} ✦
          </a>
        </div>
      </footer>
    </div>
  );
}
