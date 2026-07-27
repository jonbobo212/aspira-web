import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant, getSections, getPosts, resolveLocale, pick, localePath, type L10n } from "@/lib/tenant";
import { ui } from "@/lib/ui-strings";

/**
 * Tenant home — School template v0 (walking skeleton, design sprint follows).
 * Renders hero + about from vitrina_sections, then latest news/achievements.
 * All content is partner-provided trilingual jsonb — nothing is invented here.
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

  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-16 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold text-brand">
          {pick(hero?.content.title as L10n, locale, tenant.name)}
        </h1>
        {hero?.content.subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            {pick(hero.content.subtitle as L10n, locale)}
          </p>
        ) : null}
        <div className="mt-8">
          <Link
            href={localePath(tenant, locale, "/contact")}
            className="inline-block rounded bg-brand px-6 py-3 font-medium text-white"
          >
            {t.contactHeading}
          </Link>
        </div>
      </section>

      {about ? (
        <section className="border-t border-line py-12">
          <h2 className="text-2xl font-semibold">{t.about}</h2>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-muted">
            {pick(about.content.body as L10n, locale)}
          </p>
        </section>
      ) : null}

      {achievements.length > 0 ? (
        <section className="border-t border-line py-12">
          <h2 className="text-2xl font-semibold">{t.achievements}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {achievements.map((post) => (
              <li key={post.id} className="rounded border border-line p-4">
                <p className="font-medium">{pick(post.title, locale)}</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{pick(post.body, locale)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {news.length > 0 ? (
        <section className="border-t border-line py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold">{t.news}</h2>
            <Link href={localePath(tenant, locale, "/news")} className="text-sm text-brand">
              {t.readMore} →
            </Link>
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {news.map((post) => (
              <li key={post.id} className="rounded border border-line p-4">
                <Link href={localePath(tenant, locale, `/news/${post.id}`)} className="font-medium hover:text-brand">
                  {pick(post.title, locale)}
                </Link>
                {post.published_at ? (
                  <p className="mt-2 text-xs text-muted">
                    {new Date(post.published_at).toLocaleDateString(locale)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
