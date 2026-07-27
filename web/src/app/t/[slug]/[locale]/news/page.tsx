import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant, getPosts, resolveLocale, pick, localePath } from "@/lib/tenant";
import { ui } from "@/lib/ui-strings";

export default async function NewsList({
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

  const posts = await getPosts(tenant, undefined, 30);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.news}</h1>
      <ul className="mt-8 space-y-6">
        {posts.map((post) => (
          <li key={post.id} className="border-b border-line pb-6">
            <Link
              href={localePath(tenant, locale, `/news/${post.id}`)}
              className="text-lg font-medium hover:text-brand"
            >
              {pick(post.title, locale)}
            </Link>
            {post.published_at ? (
              <p className="mt-1 text-xs text-muted">
                {new Date(post.published_at).toLocaleDateString(locale)}
              </p>
            ) : null}
            <p className="mt-2 line-clamp-2 text-sm text-muted">{pick(post.body, locale)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
