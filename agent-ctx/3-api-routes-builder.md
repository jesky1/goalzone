---
Task ID: 3
Agent: API Routes Builder
Task: Create all API routes for the football news website

Work Log:
- Created /api/articles route (GET with filtering, POST)
- Created /api/articles/[slug] route (GET, PUT)
- Created /api/articles/[slug]/comments route (GET, POST)
- Created /api/categories route (GET)
- Created /api/live-scores route with mock data and 60s cache
- Created /api/standings route with full Premier League table
- Created /api/top-scorers route with top 10 data

Stage Summary:
- 7 API route files created
- Mock data includes 10 live matches across 4 leagues (PL, La Liga, UCL, Serie A) with mixed statuses (LIVE, HT, FT, NS)
- Full 20-team Premier League standings with realistic form data
- Top 10 scorers with goals, assists, and minutes played
- Server-side caching via Next.js revalidate (60s live scores, 300s standings/scorers)
- Article API supports: filtering by category slug, keyword search, featured flag, pagination (limit/offset)
- View count auto-incremented on article GET
- Comment creation validates both article and user existence
- All routes use Prisma ORM via `@/lib/db` for database access
- All API route files pass ESLint (0 new lint errors)
