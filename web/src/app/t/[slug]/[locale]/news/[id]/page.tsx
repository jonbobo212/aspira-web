import { notFound } from "next/navigation";
import { getTenant, getPost, resolveLocale, pick } from "@/lib/tenant";

export default async function NewsPost({
  params,
}: {
  params: Promise<{ slug: string; locale: string; id: string }>;
}) {
  const { slug, locale: rawLocale, id } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  const locale = resolveLocale(tenant, rawLocale);
  if (!locale) notFound();

  const post = await getPost(tenant, id);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{pick(post.title, locale)}</h1>
      {post.published_at ? (
        <p className="mt-2 text-sm text-muted">
          {new Date(post.published_at).toLocaleDateString(locale)}
        </p>
      ) : null}
      {post.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_url} alt="" className="mt-6 w-full rounded" />
      ) : null}
      <div className="mt-6 whitespace-pre-line leading-relaxed">{pick(post.body, locale)}</div>
    </article>
  );
}
