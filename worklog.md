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
