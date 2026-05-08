---
Task ID: 1
Agent: main
Task: Restore GOALZONE project and implement dual-column glassmorphism lineup section

Work Log:
- Extracted GOALZONE-Project (11).zip from /home/z/my-project/upload/
- Copied all source files: components/football/, components/admin/, lib/, api routes, page.tsx, layout.tsx, globals.css, configs
- Created new LineupSection component at /home/z/my-project/src/components/football/LineupSection.tsx
- Updated page.tsx to import and use LineupSection in the 'lineups' tab
- Changed tab name from 'Lineup' to 'Susunan Pemain' (Indonesian)
- Widened match detail dialog from max-w-2xl to max-w-4xl for dual-column layout
- Fixed TypeScript type issues (optional logo props, fallback empty strings)
- Verified: 0 lint errors, 0 TS errors in our files, dev server running on :3000

Stage Summary:
- LineupSection uses `grid grid-cols-1 md:grid-cols-2 gap-8` layout
- Each column has: team header with logo + formation badge, glassmorphism pitch (`backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl`), player nodes positioned on field, substitutes list
- Home team (left, red) and Away team (right, blue) each have their own separate pitch visual
- Pitch shows half-field with players positioned from GK (bottom) to FWD (top)
- Glassmorphism effect applied to pitch container with team color accents
