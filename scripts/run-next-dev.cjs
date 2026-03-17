#!/usr/bin/env node
// PM2 wrapper for Next.js dev on Windows - avoids npx/path issues (spaces in path, MODULE_NOT_FOUND)
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3000';
const cwd = process.env.PM2_CWD || process.cwd();

// Use node + local next binary directly (avoids npx resolution issues on Windows with spaces in path)
const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');
// Use 'start' - dev mode caused BUILD_ID ENOENT. Run npm run build in each service first.
const child = spawn(process.execPath, [nextBin, 'start', '-p', port], {
  stdio: 'inherit',
  cwd,
  env: { ...process.env, FORCE_COLOR: '1' }
});
child.on('exit', (code) => process.exit(code || 0));
