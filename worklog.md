---
Task ID: 1
Agent: Main Agent
Task: Fix all API routes to use footballFetch for RapidAPI support, fix UI issues, fix Vercel deployment errors

Work Log:
- Fixed `src/app/api/live-scores/route.ts` — replaced hardcoded `API_BASE` and `x-apisports-key` with `footballFetch` and `isFootballApiConfigured` from `@/lib/football-api`
- Fixed `src/app/api/top-scorers/route.ts` — same replacement
- Fixed `src/app/api/standings/route.ts` — same replacement
- Fixed `src/app/api/transfers/route.ts` — same replacement
- Fixed `src/app/api/fixtures/[id]/route.ts` — same replacement
- Fixed `src/app/api/referees/[name]/route.ts` — same replacement
- Fixed `src/app/api/players/[id]/route.ts` — same replacement
- Fixed `src/app/api/cron/generate-news/route.ts` — replaced hardcoded `FOOTBALL_API_BASE` and `footballApi()` with `footballFetch`
- Fixed `src/components/football/ThemeToggle.tsx` — added `pointer-events-auto`, `z-50`, `cursor-pointer`, `e.stopPropagation()`, `e.preventDefault()`
- Fixed `src/app/globals.css` — changed `.cyber-grid` from grid lines to subtle radial glow
- Fixed `src/components/football/NewsCard.tsx` — changed `h-48` → `aspect-video`, `object-cover` → `object-contain`
- Fixed `vercel.json` — changed cron from `*/15 * * * *` to `0 0 * * *` (Hobby plan compatible)
- Deleted `src/middleware.ts` — was causing "Both middleware file and proxy file detected" build error
- Deleted `src/app/players/` — duplicate route conflicting with `src/app/(public)/players/[id]`
- Verified dev server starts and `/api/live-scores` returns correct response

Stage Summary:
- Root cause of live scores showing dummy data: ALL API routes had hardcoded `API_BASE = 'https://v3.football.api-sports.io'` and only used `x-apisports-key` headers (direct API). When using RapidAPI, the wrong headers caused 403 errors, falling back to mock data. Now all routes use `footballFetch` which auto-detects RapidAPI vs Direct.
- To get real data on Vercel: Set `FOOTBALL_API_KEY` and `FOOTBALL_API_BASE=https://api-football-v1.p.rapidapi.com/v3` in Vercel Environment Variables
- Vercel build should now succeed: no middleware.ts conflict, cron is daily, no duplicate routes
