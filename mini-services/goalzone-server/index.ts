import { execSync } from 'child_process';

// Start Next.js dev server
const server = execSync('npx next dev -p 3000', {
  cwd: '/home/z/my-project',
  stdio: 'inherit',
  env: { ...process.env, PORT: '3000' },
});
