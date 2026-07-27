import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenant, resolveLocale, pick, type Post } from "@/lib/tenant";
import { verifyAdminToken } from "@/lib/admin-auth";
import { ui } from "@/lib/ui-strings";
import { db } from "@/lib/db";
import { AdminPostForm } from "@/components/admin-post-form";
import { deletePost } from "@/app/actions/admin";

export const dynamic = "force-dynamic"; // admin must always be fresh + token-checked

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug, locale: rawLocale } = await params;
  const { t: token } = await searchParams;

  const tenant = await getTenant(slug);
  if (!tenant) notFound();
  const locale = resolveLocale(tenant, rawLocale);
  if (!locale) notFound();
  if (!verifyAdminToken(slug, token)) notFound();
  const t = ui(locale);

  // Fresh, uncached read — the admin must see drafts/deletes immediately.
  const { data: posts } = await db()
    .from("vitrina_posts")
    .select("id, kind, title, published_at")
    .eq("tenant_id", tenant.id)
    .order("published_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.adminTitle}</h1>

      <div className="mt-8">
        <AdminPostForm
          tenantSlug={tenant.slug}
          token={token!}
          locale={locale}
          labels={{
            kinds: {
              news: t.postKindNews,
              achievement: t.postKindAchievement,
              announcement: t.postKindAnnouncement,
            },
            title: t.fieldTitle,
            body: t.fieldBody,
            publish: t.publish,
            publishedOk: t.publishedOk,
            translationsPending: t.translationsPending,
            error: t.formError,
          }}
        />
      </div>

      <h2 className="mt-12 text-xl font-semibold">{t.recentPosts}</h2>
      <ul className="mt-4 space-y-2">
        {((posts ?? []) as Pick<Post, "id" | "kind" | "title" | "published_at">[]).map((post) => (
          <li
            key={post.id}
            className="flex items-center justify-between gap-4 rounded border border-line px-4 py-2"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{pick(post.title, locale)}</p>
              <p className="text-xs text-muted">
                {post.kind}
                {post.published_at ? ` · ${new Date(post.published_at).toLocaleDateString(locale)}` : ""}
              </p>
            </div>
            <form
              action={async (formData: FormData) => {
                "use server";
                await deletePost({ ok: null }, formData);
              }}
            >
              <input type="hidden" name="tenant" value={tenant.slug} />
              <input type="hidden" name="token" value={token!} />
              <input type="hidden" name="id" value={post.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                {t.remove}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
