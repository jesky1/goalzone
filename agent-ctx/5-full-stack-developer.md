# Task 5 - Build /api/generate-article endpoint with LLM integration

## Agent: full-stack-developer

## Work Completed

### 1. API Route: `/src/app/api/generate-article/route.ts`
- POST endpoint with admin auth via `verifyAdmin` from `@/lib/admin-auth`
- Request body: `{ topic: string, category?: string }`
- Uses `ZAI.create()` from `z-ai-web-dev-sdk` for LLM chat completion
- System prompt instructs AI to write Indonesian football articles with structured JSON output
- Validates category against 10 allowed values (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Europa League, Transfer, Timnas, Analisis)
- Returns: `{ success: true, article: { title, content, summary, category, readTime } }`
- Error handling for auth, validation, JSON parsing, and LLM errors

### 2. UI Update: `/src/components/admin/NewsEnginePanel.tsx`
- Added "AI Article Generator" section at top of panel
- Topic text input with Enter key support
- Category dropdown selector (10 categories)
- "Generate with AI" button with Sparkles icon and violet gradient
- Loading state with spinner while generating
- Error display for failures
- Animated article preview showing title, category badge, read time, summary, HTML content
- Copy-to-clipboard buttons for title, summary, and content HTML
- Dismiss button to clear preview

### Lint: 0 errors, 2 pre-existing warnings
