# Aspira Web

Multi-tenant partner-sites platform: free trilingual websites for private
schools, education agencies, language centers, teachers, and education
influencers in Uzbekistan, Tajikistan, and Kyrgyzstan — branded under Aspira
("Powered by Aspira" badge on every site).

- App: `web/` — Next.js 16 multi-tenant runtime, one deployment serves every
  tenant on `{slug}.aspira.study`. See `web/AGENTS.md` for architecture,
  hard rules, and current state.
- Plan: `docs/ASPIRA_WEB_PLAN.md`.
- Data: shared ecosystem Supabase, tables prefixed `vitrina_`.
