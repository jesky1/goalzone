---
Task ID: 1-7
Agent: main
Task: Add dark/light theme toggle with modern UI/UX

Work Log:
- Updated globals.css with comprehensive light/dark CSS variables
  - Made all custom colors (deep-xxx, neon) theme-aware via CSS variables
  - Made glass, neon, cyber-grid, scrollbar CSS classes theme-aware
  - Defined proper light theme (:root) with clean white/gray/blue palette
  - Preserved dark theme (.dark) with cyber/neon aesthetic
- Added ThemeProvider from next-themes to layout.tsx
  - Configured with attribute="class", defaultTheme="dark", enableSystem
- Created ThemeToggle.tsx component with animated sun/moon toggle
  - Uses Framer Motion for smooth rotate/scale transitions
  - Responsive design - shows in both desktop and mobile nav
  - Proper mounting detection to avoid hydration mismatch
- Updated Navbar.tsx to include ThemeToggle in desktop and mobile views
- Updated page.tsx with 69 dark: variant additions for text/background/border colors
- Updated 7 football components with dark: variants:
  - StandingsWidget.tsx (7 changes)
  - TopScorersWidget.tsx (10 changes)
  - FanTokenWidget.tsx (15 changes)
  - LiveScoreTicker.tsx (1 change)
  - TransferFeed.tsx (13 changes)
  - PitchView.tsx (10 changes - outside elements only, pitch internals preserved)
  - Footer.tsx (3 changes)

Stage Summary:
- Full dark/light theme support implemented across the entire GOALZONE website
- Theme toggle button placed in Navbar (desktop right side + mobile menu)
- Default theme is dark; supports system preference detection
- All custom theme classes (glass, neon, deep-xxx) are CSS-variable based and auto-switch
- Standard Tailwind colors use dark: prefix pattern
- Lint passes with 0 errors
- Dev server compiles successfully

---
Task ID: 8
Agent: main
Task: Create enhanced Match Tactics (PitchView) component with PlayerNode

Work Log:
- Completely rewrote `src/components/football/PitchView.tsx` with enhanced visuals
- Created `PlayerNode` component replacing simple colored dots with:
  - Circular player photo with position-colored border and glow
  - Jersey number badge in bottom-right corner of photo
  - Player last name displayed below in white with drop shadow
  - Fallback initials when no photo available
  - Event indicators (goals, yellow/red cards) above player
- Enhanced hover interaction:
  - Player scales up on hover with spring animation
  - Detailed stats card appears with: photo, full name, position label, number, rating badge (color-coded), and event summary tags
  - Home players show tooltip below, away players show above
- Improved pitch surface:
  - Richer green gradient (darker greens: #14532d → #15803d)
  - Horizontal grass stripe pattern overlay
  - Subtle SVG noise texture
  - Stadium light effect at top edge
  - Enhanced SVG pitch lines with proper goal posts
- Pitch lines use CSS variables `--pitch-line-color` and `--pitch-line-accent` for theme-awareness
- Updated `MatchDetailModal` in page.tsx to default to 'pitch' tab (was 'lineups')
- Removed Tooltip dependency (replaced with custom hover card)
- Lint passes with 0 errors, dev server compiles successfully

Stage Summary:
- Enhanced PitchView component with photo-based player nodes, number badges, and interactive hover stats
- Players now display real photos from API-Football with graceful fallback to initials
- Formation mapping (4-3-3, 4-4-2, etc.) accurately positioned on grid using API-Football grid data
- Dark/light theme aware via CSS variables for pitch lines
- Default match detail tab changed to show tactics/pitch first

---
Task ID: 9
Agent: main
Task: Fix player photos not showing and improve team separation on pitch

Work Log:
- Analyzed screenshot showing colored dots instead of photos and teams not visually separated
- Root cause: Mock data in fixtures API had empty photo URLs (`photo: ''`)
- Added real API-Football player photo URLs to mock data using `https://media.api-sports.io/football/players/{id}.png` pattern
- Updated all 24 players in mock data with real player IDs and photo URLs
- Rewrote PitchView with team-colored approach:
  - Home team uses RED color (#ef4444), away team uses BLUE (#3b82f6)
  - Player borders and number badges use team colors (not position colors)
  - Pitch split into two halves with subtle blue/red tint overlays
  - Center line has accent styling as divider
- Improved Y-position mapping for clear team separation:
  - Away team: GK at 8%, DEF at 22%, MID at 34%, FWD at 42% (top half only)
  - Home team: GK at 92%, DEF at 78%, MID at 66%, FWD at 58% (bottom half only)
  - No overlap between teams (center gap from 42%-58%)
- Added team-colored formation badges in header (blue for away, red for home)
- Player nodes now show photo or initials on team-colored background
- Lint passes with 0 errors, dev server compiles successfully

Stage Summary:
- Player photos now display using real API-Football media CDN URLs
- Clear visual separation: away team (top/blue) vs home team (bottom/red)
- Formation mapping compressed to each half with no center overlap
- Team colors used for borders, badges, hover effects, and pitch tint

---
Task ID: 10
Agent: main
Task: Show club logos everywhere - as player avatar fallbacks and pitch watermarks

Work Log:
- Updated PlayerNode to accept teamLogo prop for club logo display
- Implemented 3-layer avatar system:
  - Layer 1: Player photo (priority, shown when available from API-Football)
  - Layer 2: Club/team logo (fallback when player photo missing or fails to load)
  - Layer 3: Initials (final fallback when neither photo nor logo available)
- Added TeamWatermark component for large semi-transparent team logos on each pitch half
  - Away team logo watermark centered at 25% height (top half)
  - Home team logo watermark centered at 75% height (bottom half)
  - 8% opacity for subtle watermark effect
- Improved logo reliability:
  - Uses effectiveHomeLogo = homeLineup?.team?.logo || homeLogo (prioritizes lineup data)
  - Team logo containers in header now have bg-white/10 background for visibility
  - Both header logos and player fallbacks use same effective logo source
- Added imgError state management with useState for proper error handling on player photos
- Fixed pitch structure: moved all content under single absolute container with aspect ratio
- Separation verified: away y: 7-43%, home y: 57-93% (14% gap at center)
- Lint passes with 0 errors

Stage Summary:
- All club logos now visible: in header, as player avatar fallbacks, and as pitch watermarks
- Players show club logo when their individual photo is unavailable
- Large team logo watermarks add visual identity to each pitch half
- Teams clearly separated with no overlap (14% center gap)

---
Task ID: 11
Agent: main
Task: Create FIFA/EA FC-style Referee Profile Modal

Work Log:
- Created `src/components/football/RefereeModal.tsx` — a cinematic referee profile modal
  - Digital ID Card design (not a boring popup) with glassmorphism
  - HexPattern SVG overlay: geometric football pentagon pattern as background
  - Scanline effect overlay for CRT/FIFA aesthetic
  - Neon glow border using conic-gradient and CSS variable `--c-neon`
  - 3D tilt-on-hover using Framer Motion useMotionValue + useSpring (±3deg)
- Framer Motion animations:
  - Backdrop: opacity fade-in with blur(16px), saturate(0.3), brightness(0.2)
  - Modal: scale(0.6→1) + rotateX(15deg→0) + rotateY(-5deg→0) — card placement feel
  - Custom cubic-bezier [0.22, 1, 0.36, 1] for fast start, smooth settle
  - Staggered animations for each section (header, avatar, stats, bars, tags)
- StatRing component: SVG circular progress for Matches/Yellows/Reds/Penalties
- StatBar component: Horizontal progress bars with icon, label, animated fill
- SpecialtyTag component: Neon-styled pill badges for referee specialties
- Profile section: Avatar with spinning glow ring, name, nationality, residence, federation
- Trophy section: Biggest match highlight
- FIFA chip decoration at bottom for authenticity
- ESC key support for closing
- Props: `RefereeData` interface with 18 data fields (name, photo, age, nationality, etc.)
- Created `src/app/api/referees/[name]/route.ts` — referee data API
  - 8 known referees with realistic stats (Oliver, Taylor, Turpin, Orsato, Brych, Marciniak, Mateu Lahoz)
  - API-Football /referees search integration (when FOOTBALL_API_KEY is set)
  - Deterministic default generation from name hash for unknown referees
- Integrated into `page.tsx`:
  - MatchDetailModal now accepts `onRefereeClick` prop
  - Referee name shown as clickable button with underline, hover glow, and chevron indicator
  - `handleRefereeClick` fetches referee data then opens RefereeModal
  - RefereeModal rendered at root level (z-100) for proper layering
- Lint passes with 0 errors, dev server compiles successfully
- Confirmed working: `GET /api/referees/Michael%20Oliver 200` in dev logs

Stage Summary:
- Professional FIFA/EA FC-style referee profile modal implemented
- Cinematic transitions: blur backdrop, 3D card placement animation, staggered reveals
- 8 pre-built referee profiles with realistic stats; supports any referee name
- Glassmorphism card with hexagonal pattern, neon glow border, scanline overlay
- Interactive 3D tilt-on-hover effect for immersion
- Triggered by clicking referee name in match detail modal

---
Task ID: 12
Agent: main
Task: Generate AI referee photos for all known referees

Work Log:
- Generated 8 professional AI referee portrait photos using z-ai image generation CLI
  - Michael Oliver, Anthony Taylor, Clément Turpin, Daniele Orsato
  - Felix Brych, Szymon Marciniak, Antonio Mateu Lahoz, Daniele Doveri
- All photos saved to `public/referees/` directory as PNG files (864x1152 portrait)
- Updated `src/app/api/referees/[name]/route.ts` to use local `/referees/{name}.png` paths
- Prompts designed for FIFA official headshot style: black referee uniform, studio lighting, dark background
- Lint passes with 0 errors, all 8 image files confirmed present

Stage Summary:
- 8 AI-generated referee portrait photos created and deployed
- RefereeModal now displays real referee photos in the avatar section
- All photos are local assets in public/referees/ for instant loading with no external dependencies
