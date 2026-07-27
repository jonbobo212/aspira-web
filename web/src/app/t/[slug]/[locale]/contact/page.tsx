import { notFound } from "next/navigation";
import { getTenant, resolveLocale, pick } from "@/lib/tenant";
import { ui } from "@/lib/ui-strings";
import { LeadForm } from "@/components/lead-form";

export default async function ContactPage({
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

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t.contactHeading}</h1>
      <div className="mt-4 space-y-1 text-sm text-muted">
        {tenant.contact.phone ? <p>{tenant.contact.phone}</p> : null}
        {tenant.contact.address ? <p>{pick(tenant.contact.address, locale)}</p> : null}
        {tenant.contact.telegram ? (
          <p>
            <a className="text-brand underline" href={`https://t.me/${tenant.contact.telegram.replace(/^@/, "")}`}>
              Telegram
            </a>
          </p>
        ) : null}
      </div>
      <div className="mt-8">
        <LeadForm
          tenantSlug={tenant.slug}
          locale={locale}
          sourcePage="contact"
          labels={{
            name: t.formName,
            phone: t.formPhone,
            message: t.formMessage,
            submit: t.formSubmit,
            thanks: t.formThanks,
            error: t.formError,
          }}
        />
      </div>
    </div>
  );
}
