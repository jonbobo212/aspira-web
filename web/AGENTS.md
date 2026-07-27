# Aspira Web — multi-tenant partner-sites platform (bus code: vitrina)

One Next.js app serves every gifted partner site: `{slug}.aspira.study` →
`src/proxy.ts` rewrites to `/t/{slug}/{locale}/…` → tenant row in the shared
Supabase (`mywdtmimiazeyhfdtqlw`, tables prefixed `vitrina_`) picks template,
brand, and content. Full spec: t100u repo `docs/SITE_FACTORY.md`; build plan:
`docs/ASPIRA_WEB_PLAN.md` (repo root).

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind v4
- No next-intl: tenant locales are dynamic per market (uz/tg/ky + ru + en).
  URL scheme: default locale unprefixed, others `/{locale}/…`. `_` is the
  internal "tenant default" segment — never expose it in links (use
  `localePath()` from `src/lib/tenant.ts`).
- Data access server-side only via service role (`src/lib/db.ts`, lazy
  constructor — NEVER construct SDK clients at module scope; that failure
  mode broke Aplify preview builds). Browser-facing writes go through server
  actions; RLS on `vitrina_*` is the backstop.

## Hard rules (owner, inherited via sync bus rows #39–#44)
1. **Honest content only** — render only partner-provided or verified facts;
   the AI pipeline must never invent stats. Testimonials carry `source_note`.
2. **No legal entity names on any public surface** — framing is
   "international education platform … all rights reserved".
3. Markets: Uzbekistan, Tajikistan, Kyrgyzstan only. Commissions/commercial
   terms never public.
4. Everything partner-facing is trilingual (local/RU/EN). Content model:
   jsonb `{locale: text}` + `machine_locales` flags — human edits are never
   overwritten by re-translation.
5. **The badge is the payment**: every tenant footer renders
   "Powered by Aspira" → gateway on aspira.study (`src/lib/badge.ts` holds the
   URL contract, `?ref={partner_code}` attribution). Never remove it.
6. Aspira positioning in all partner copy: free assessment/prep toolkit +
   partner NETWORK that routes leads to centers/teachers — connect, never
   compete.

## Caching (ecosystem playbook — t100u docs/CACHING_PLAYBOOK.md, bus row #54)
- L1/L2 (live): all tenant reads go through `unstable_cache` tagged
  `tenant:{slug}` (`tenantTag()` in `src/lib/tenant.ts`), 5-min TTL fallback.
  Every CMS/pipeline write MUST call `revalidateTag(tenantTag(slug))` — pages
  then regenerate only when the tenant's content changes. Planned: migrate to
  `cacheComponents` + `"use cache"`/`cacheTag` during the template design
  sprint (keep tag names identical).
- L3 (pipeline, when built): ALL generation steps (palette, brochure parse,
  site copy, translations) read through `public.t100u_ai_cache` keyed by
  sha256(model+system+prompt+params), app='vitrina' — re-running a wizard is
  ~free; unchanged text is never re-translated. No PII in cached values.
- L4: generation prompts keep the big stable prefix byte-stable with
  `cache_control: ephemeral`; per-tenant facts go last.

## Sync bus
`public.t100u_ecosystem_sync` in the shared Supabase; this app's code is
`vitrina` (internal only, never public). Sync on start of substantive work,
ack processed rows, post status after significant work with ref=commit.

## Current state (Phase 0)
- Schema migration `vitrina_core_schema` applied (tenants/sections/posts/
  media/staff/courses/testimonials/admins/intakes/leads + RLS).
- Tenant runtime: hostname routing, brand CSS vars, School template v0
  (home/news/news-detail/contact + lead form → vitrina_leads), per-tenant
  data caching with `tenant:{slug}` tags.
- Admin CMS v1: token-gated `/admin?t={token}` (`src/lib/admin-auth.ts`,
  VITRINA_ADMIN_SECRET HMAC — Aspira class-board pattern; Supabase-auth
  members are Phase 1). Post news/achievement/announcement → translate-on-
  save (Haiku `claude-haiku-4-5` via `src/lib/translate.ts`, byte-stable
  system prompt + cache_control, read-through `t100u_ai_cache` L3) →
  `revalidateTag(tenantTag, {expire: 0})`. Degrades without
  ANTHROPIC_API_KEY: publishes source locale, `machine_locales` empty for
  later backfill.
- NOT YET: template design sprint (the craft pass), media upload, AI intake
  pipeline (wizard/palette/brochure), Aplify lead forwarding, Aspira
  classroom/T100U blocks,
  Vercel deploy (owner: import repo, root dir `web/`, envs, wildcard DNS).
