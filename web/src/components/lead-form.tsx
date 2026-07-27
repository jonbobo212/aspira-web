"use client";

import { useActionState } from "react";
import { submitLead, type LeadState } from "@/app/actions/lead";

interface Labels {
  name: string;
  phone: string;
  message: string;
  submit: string;
  thanks: string;
  error: string;
}

export function LeadForm({
  tenantSlug,
  locale,
  sourcePage,
  labels,
}: {
  tenantSlug: string;
  locale: string;
  sourcePage: string;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead, { ok: null });

  if (state.ok) {
    return <p className="rounded border border-line bg-paper p-4 text-brand">{labels.thanks}</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tenant" value={tenantSlug} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source_page" value={sourcePage} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="lead-name">
          {labels.name}
        </label>
        <input
          id="lead-name"
          name="name"
          required
          maxLength={120}
          className="w-full rounded border border-line px-3 py-2 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="lead-phone">
          {labels.phone}
        </label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          required
          maxLength={32}
          className="w-full rounded border border-line px-3 py-2 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="lead-message">
          {labels.message}
        </label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          maxLength={2000}
          className="w-full rounded border border-line px-3 py-2 outline-none focus:border-brand"
        />
      </div>
      {state.ok === false ? <p className="text-sm text-red-600">{labels.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand px-6 py-2.5 font-medium text-white disabled:opacity-60"
      >
        {labels.submit}
      </button>
    </form>
  );
}
