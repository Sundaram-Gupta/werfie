// Ensures auth-service is running: remove stale entry then start from ecosystem.
// Run from repo root: node scripts/start-auth-service.cjs  or  npm run pm2:auth
const { execSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
try {
  execSync('pm2 delete auth-service', { stdio: 'ignore', cwd: repoRoot });
} catch (_) {
  // ignore if app not in list
}
execSync('pm2 start ecosystem.config.js --only auth-service', { stdio: 'inherit', cwd: repoRoot });
