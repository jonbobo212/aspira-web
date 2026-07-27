"use client";

import { useActionState } from "react";
import { createPost, type AdminActionState } from "@/app/actions/admin";

interface Labels {
  kinds: { news: string; achievement: string; announcement: string };
  title: string;
  body: string;
  publish: string;
  publishedOk: string;
  translationsPending: string;
  error: string;
}

export function AdminPostForm({
  tenantSlug,
  token,
  locale,
  labels,
}: {
  tenantSlug: string;
  token: string;
  locale: string;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<AdminActionState, FormData>(createPost, {
    ok: null,
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tenant" value={tenantSlug} />
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="locale" value={locale} />
      <div className="flex gap-4 text-sm">
        {(["news", "achievement", "announcement"] as const).map((kind, i) => (
          <label key={kind} className="flex items-center gap-1.5">
            <input type="radio" name="kind" value={kind} defaultChecked={i === 0} />
            {labels.kinds[kind]}
          </label>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="post-title">
          {labels.title}
        </label>
        <input
          id="post-title"
          name="title"
          required
          maxLength={300}
          className="w-full rounded border border-line px-3 py-2 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="post-body">
          {labels.body}
        </label>
        <textarea
          id="post-body"
          name="body"
          required
          rows={8}
          maxLength={20000}
          className="w-full rounded border border-line px-3 py-2 outline-none focus:border-brand"
        />
      </div>
      {state.ok ? (
        <p className="rounded border border-line bg-paper p-3 text-sm text-brand">
          {labels.publishedOk}
          {state.translated === false ? ` ${labels.translationsPending}` : null}
        </p>
      ) : null}
      {state.ok === false ? <p className="text-sm text-red-600">{labels.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand px-6 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {labels.publish}
      </button>
    </form>
  );
}
