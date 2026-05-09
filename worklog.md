---
Task ID: 1
Agent: main
Task: Create global football fetcher, remove mock data, use real Football API

Work Log:
- Explored entire codebase: found existing football-api.ts, team detail page with inline Squad/MatchList, static match-data.ts
- Created lib/football.ts as comprehensive global fetcher with x-apisports-key header, convenience methods
- Updated all 11 API route imports from @/lib/football-api to @/lib/football
- Rewrote /api/matches route to fetch from real Football API instead of static mock data
- Updated /api/live-scores to remove mock data fallback, return 503 when no API key
- Added FOOTBALL_API_KEY placeholder to .env
- Added Match model to Prisma schema for sync-matches support
- Ran db:push to sync schema
- Verified app compiles and API endpoints return correct responses
- Committed changes but GitHub push failed (PAT token expired/revoked)

Stage Summary:
- lib/football.ts created with global fetcher using x-apisports-key header
- All mock data removed from /api/matches and /api/live-scores
- Team detail page already correctly uses /players/squads and /fixtures endpoints
- User needs to: (1) add FOOTBALL_API_KEY to .env, (2) push to GitHub with valid token
