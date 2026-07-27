# Aspira Web — Phase 0 build plan (bus code: vitrina)

Session plan responding to bus rows #39 (kickoff), #40 (scope expansion),
#41 (brand = Aspira Web, badge "Powered by Aspira"), #44 (gateway pages on
aspira.study; tenant sites default `{partner}.aspira.study`).

Inherited hard rules baked into everything below: honest content only (no
invented stats — partner-provided or verified facts only), no legal entity
names on any public surface ("international education platform … all rights
reserved"), markets UZ/TJ/KG only, commissions/commercial terms never public,
all partner-facing content trilingual (local / RU / EN).

## 1. Repo scaffold

- **New repo `aspira-web`** (owner/T100U to confirm name), ONE multi-tenant
  Next.js app → ONE Vercel project. 50 or 500 tenants = same infra.
- Stack mirrors the ecosystem: Next.js 16 (App Router, Turbopack) + React 19 +
  TypeScript, Tailwind v4 + shadcn/ui, next-intl. Locale packs per market:
  `uz/ru/en`, `tj/ru/en`, `ky/ru/en` — a tenant's market picks its trio; the
  local language is the default locale of that tenant's site.
- **Tenant resolution by hostname**: proxy/middleware maps
  `{slug}.aspira.study` (and later custom domains via a `custom_domain`
  column) → tenant row → template + theme + content. No per-tenant deploys.
- Per-tenant theming = CSS variables injected from the tenant's `brand` JSON
  (palette derived from their logo by the AI pipeline).
- `.claude/settings.json` with `permissions.defaultMode: "bypassPermissions"`
  (same shape as t100u repo).
- DNS dependency: wildcard `*.aspira.study` must be pointed at the Aspira Web
  Vercel project. aspira.study is owned by the Aspira session → coordinate via
  bus (question posted). aspira.network ($7.99/yr) stays optional upgrade only.

## 2. Tenant schema (shared Supabase `mywdtmimiazeyhfdtqlw`, prefix `vitrina_`)

All tables prefixed `vitrina_` for later `pg_dump -t 'public.vitrina_*'`
extraction, same pattern as `t100u_`.

- **`vitrina_tenants`** — id, `slug` (subdomain, FROZEN once live), `type`
  (`school|agency|language_center|teacher|influencer`), name, city,
  `country` (`uz|tj|kg`), `locales` text[] (e.g. `{uz,ru,en}`),
  `default_locale`, `template` (school|agency|center|teacher_card|linkbio),
  `brand` jsonb (colors, logo_url, fonts), `partner_code` →
  `t100u_agencies.code` (referral attribution), `status`
  (`draft|generating|live|suspended`), `custom_domain`, `contract_start`,
  `contract_ends` (yearly badge contract), timestamps.
- **Trilingual content model**: every human-visible text field is jsonb
  `{"uz": …, "ru": …, "en": …}` plus a sidecar `machine_locales` text[]
  marking which entries are machine-translated (so a human edit clears the
  flag and re-translation only overwrites machine entries). One model, all
  three markets — key set follows the tenant's `locales`.
- **`vitrina_sections`** — template-driven page blocks: tenant_id, page
  (home/about/admissions/…), kind (hero/stats/programs/cta/…), position,
  `content` jsonb (trilingual fields inside), visible. Templates define the
  allowed section kinds; content rows fill them.
- **`vitrina_posts`** — the CMS heart: tenant_id, kind
  (`news|achievement|announcement`), trilingual title/body, cover media,
  gallery refs, published_at. This is what the phone-simple admin writes.
- **`vitrina_media`** — Supabase Storage refs, trilingual alt text.
- **`vitrina_staff`** (school staff / center teachers: name, role, bio
  trilingual, photo), **`vitrina_courses`** (language centers: name, level,
  schedule, price optional — only if partner wants it public),
  **`vitrina_testimonials`** (provided by partner, marked as such — honesty
  rule: we publish only what they supply, attributed).
- **`vitrina_admins`** — Supabase auth user ↔ tenant membership + role
  (`owner|editor`). Per-tenant admin login for the CMS.
- **`vitrina_intakes`** — wizard submissions + AI pipeline state: raw answers
  jsonb, uploads (logo, brochure), pipeline stage
  (`received|parsed|generated|review|live`), cost cents, error.
- **`vitrina_leads`** — every public form submit (name, phone, message,
  locale, tenant_id, source page). Kept locally AND forwarded per the lead
  plumbing rules (§6).
- **RLS**: public (anon) SELECT only on content of `status='live'` tenants;
  all writes tenant-scoped via `vitrina_admins` membership; `vitrina_leads`
  anon INSERT-only with constrained columns (same hardening pattern Aplify
  applied to consultations); intakes/pipeline staff-only.

## 3. Templates (two tiers)

**Prestige tier — multi-page:**
1. **School** (Phase 0, built first, best model): home, about, news,
   achievements/olympiads, gallery, staff, admissions/contact, announcements.
   Pre-wired ecosystem blocks: Aspira classroom join (QR per class — uses
   Aspira's live classroom mode), "Study abroad" T100U block, both carrying
   the school's `partner_code` ref.
2. **Agency**: CTA-heavy — destinations, services, achievements, gallery,
   lead forms everywhere → Aplify with `agency_code`; Aplify CRM link in
   their admin.
3. **Language Center**: courses, schedule, results board (partner-provided
   results only), enrollment CTAs, gallery → students route to Aspira prep.

**Viral tier — one-pagers (single AI pass, near-zero cost):**
4. **Teacher card**: bio, method, student results (as provided), testimonials,
   enroll CTA; students → Aspira; teacher gets a referral `agency_code`
   (micro-agent).
5. **Link-in-bio** (influencers): links + lead magnet block (free IELTS
   mini-test → aspira.study with their ref code).

**Badge (the payment)**: footer component on every tenant site —
"Powered by Aspira" → gateway page by partner type
(`aspira.study/schools-web`, `/agencies-web`, later `/teachers-web`,
`/centers-web`) with `?ref={partner_code}`. Gateway pages themselves are
built by the Aspira session (bus row #44) — we only link to them and agree
on the URL contract.

Design bar: templates are the craft part — built with the best model,
distinct per tier, NOT the AI-default look (t100u's "Index v2" lesson:
avoid warm-paper+serif+gold cliché; institutional-honest voice). Cyrillic
coverage mandatory in all font choices (RU + UZ/KY Cyrillic users; TJ is
Cyrillic-script).

## 4. AI pipeline (per-site cost target $1–3)

Wizard (~10 questions: name, city, phone, socials, programs/classes,
achievement highlights) + logo upload + optional brochure/PDF → `vitrina_intakes`
row → pipeline stages:

1. **Logo vision → palette** (Sonnet vision): brand colors + light/dark
   accents → `tenants.brand`.
2. **Brochure/checklist parse → structured facts** (Sonnet): only extracted
   facts, each tagged with its source; nothing invented.
3. **Trilingual site copy** (Sonnet): all sections in the market's 3 locales,
   honesty system prompt (only provided/verified facts; no "97% success"
   style claims; Aspira positioning = connect-not-compete).
4. **Human review gate**: generated site sits at `status='review'` on its
   subdomain behind a preview flag until we flip it live.
5. **Translate-on-save** (Haiku): every CMS edit auto-translates to the other
   two locales, marks them `machine_locales`, editable by the partner.

Model tiering: Fable/Opus for the master templates (one-time craft), Sonnet
for per-site generation, Haiku for routine CMS translations.

Auto-deliverables: admin credentials + personalized PDF training guide in the
partner's language ("post news, add photos, edit anything — from your phone").

## 5. CMS (per-tenant admin)

`/admin` on the tenant's own subdomain: phone-first UI, four actions —
post news, upload photos, add achievement, add announcement. Save → Haiku
translation → live in 3 languages. No tech skills assumed.

## 6. Lead plumbing

- **Agency sites**: every form posts into Aplify with that agency's
  `agency_code` (existing attribution system). Local copy in `vitrina_leads`.
- **School sites**: Aspira classroom-join QR blocks + T100U "study abroad"
  links stamped with the school's `partner_code` from `t100u_partner_directory`
  (rollup to parent agency already live on Aplify's side).
- **Teacher / influencer pages**: outbound Aspira/T100U links carry their
  referral code (`?ref=`), same first-touch cookie contract as t100u.
- Insert path: reuse the constrained-anon-insert pattern (force status,
  length checks) agreed for consultations.

## 7. Phase 0 deliverables (this sprint)

1. Repo scaffold (multi-tenant runtime, hostname routing, next-intl trio
   locales, theming) + `vitrina_` migrations on shared Supabase.
2. **School template** built against the real pilot: owner's own school
   (needs from owner: logo, brochure/checklist, the 10 wizard answers).
3. Badge component + gateway URL contract agreed with Aspira session.
4. Wizard v1 (internal-facing is fine for the pilot) + pipeline stages 1–3
   runnable end-to-end on the pilot inputs.
5. Admin CMS v1 (post news / photo / achievement / announcement +
   translate-on-save).
6. PDF training guide generator (per-tenant, in partner's language).

Then Phase 1: Agency template + 5 real agencies + Aplify 3-month clock;
Phase 2: scale via invite links; teacher-card/link-in-bio tier ships with
Phase 2 (cheap to add once the runtime exists).

## 8. Open questions (posted to bus)

1. Repo name `aspira-web` under jonbobo212 — confirm, and this session needs
   it added as a session source once created.
2. Wildcard `*.aspira.study` → Aspira Web Vercel project: Aspira session owns
   the domain — need the delegation (or owner adds the wildcard record).
3. Table prefix `vitrina_` (internal-only name, consistent with bus code) —
   confirm vs `aspiraweb_`.
4. Gateway URL contract: confirm `?ref={partner_code}` param name with the
   Aspira session so attribution survives the hop.
