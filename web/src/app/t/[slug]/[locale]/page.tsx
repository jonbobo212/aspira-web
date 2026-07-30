import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant, getSections, getPosts, resolveLocale, pick, localePath, type L10n } from "@/lib/tenant";
import { ui } from "@/lib/ui-strings";
import { BlurText } from "@/components/motion/blur-text";
import { CountUp } from "@/components/motion/count-up";
import { Aurora } from "@/components/motion/aurora";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { GradientText } from "@/components/motion/gradient-text";

interface StatItem {
  value: number;
  suffix?: string;
  label: L10n;
}

/**
 * Tenant home — School template, full motion pass (owner directive, React
 * Bits patterns as own implementations): Aurora + dot-grid hero with BlurText
 * headline and shiny CTA, glass CountUp stats, scroll-Reveal sections,
 * TiltCard achievements, hover-lift news cards. All content remains
 * partner-provided trilingual jsonb — nothing invented; every effect is
 * transform/opacity-only and honors prefers-reduced-motion.
 */
export default async function TenantHome({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale: rawLocale } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  const locale = resolveLocale(tenant, rawLocale);
  if (!locale) notFound();
  const t = ui(locale);

  const [sections, news, achievements] = await Promise.all([
    getSections(tenant, "home"),
    getPosts(tenant, "news", 3),
    getPosts(tenant, "achievement", 3),
  ]);

  const hero = sections.find((s) => s.kind === "hero");
  const about = sections.find((s) => s.kind === "about");
  const stats = sections.find((s) => s.kind === "stats");
  const statItems = ((stats?.content.items as StatItem[]) ?? []).filter(
    (item) => typeof item.value === "number"
  );

  return (
    <div>
      {/* Hero — the one big moment: aurora + dot grid + blur-in headline */}
      <section className="relative overflow-hidden">
        <Aurora />
        <div aria-hidden="true" className="dot-grid absolute inset-0" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:py-28">
          <p className="kicker">
            <GradientText text={tenant.city ?? tenant.name} />
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            <BlurText text={pick(hero?.content.title as L10n, locale, tenant.name)} className="text-brand" />
          </h1>
          {hero?.content.subtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              {pick(hero.content.subtitle as L10n, locale)}
            </p>
          ) : null}
          <div className="mt-10">
            <Link
              href={localePath(tenant, locale, "/contact")}
              className="btn-shiny inline-block rounded-full bg-brand px-8 py-3.5 font-medium text-white shadow-lg shadow-brand/25 transition-transform hover:scale-[1.03]"
            >
              {t.contactHeading} →
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* Stats — glass cards, staggered reveal, counting numbers */}
        {statItems.length > 0 ? (
          <section className="relative -mt-6 pb-4">
            <dl className="grid gap-4 sm:grid-cols-3">
              {statItems.map((item, i) => (
                <Reveal key={i} delay={i * 120}>
                  <div className="glass rounded-2xl px-6 py-7 text-center">
                    <dd className="text-4xl font-bold tracking-tight text-brand sm:text-5xl">
                      <CountUp value={item.value} suffix={item.suffix ?? ""} />
                    </dd>
                    <dt className="mt-2 text-sm text-muted">{pick(item.label, locale)}</dt>
                  </div>
                </Reveal>
              ))}
            </dl>
          </section>
        ) : null}

        {about ? (
          <Reveal>
            <section className="py-14">
              <p className="kicker">{t.about}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{tenant.name}</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-muted">
                {pick(about.content.body as L10n, locale)}
              </p>
            </section>
          </Reveal>
        ) : null}

        {achievements.length > 0 ? (
          <section className="border-t border-line py-14">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                <GradientText text={t.achievements} />
              </h2>
            </Reveal>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {achievements.map((post, i) => (
                <Reveal key={post.id} delay={i * 120}>
                  <TiltCard className="h-full">
                    <li className="glass h-full rounded-2xl p-6">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                        style={{ background: "linear-gradient(135deg, var(--brand-accent), color-mix(in srgb, var(--brand-accent) 55%, var(--brand)))" }}
                      >
                        {i + 1}
                      </span>
                      <p className="mt-4 font-semibold">{pick(post.title, locale)}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                        {pick(post.body, locale)}
                      </p>
                    </li>
                  </TiltCard>
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}

        {news.length > 0 ? (
          <section className="border-t border-line py-14">
            <Reveal>
              <div className="flex items-baseline justify-between">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.news}</h2>
                <Link href={localePath(tenant, locale, "/news")} className="text-sm font-medium text-brand hover:underline">
                  {t.readMore} →
                </Link>
              </div>
            </Reveal>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {news.map((post, i) => (
                <Reveal key={post.id} delay={i * 120}>
                  <li className="card-lift h-full rounded-2xl border border-line bg-white p-6">
                    <Link href={localePath(tenant, locale, `/news/${post.id}`)} className="font-semibold hover:text-brand">
                      {pick(post.title, locale)}
                    </Link>
                    {post.published_at ? (
                      <p className="mt-2 text-xs text-muted">
                        {new Date(post.published_at).toLocaleDateString(locale)}
                      </p>
                    ) : null}
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{pick(post.body, locale)}</p>
                  </li>
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
