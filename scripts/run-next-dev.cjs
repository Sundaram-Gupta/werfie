#!/usr/bin/env node
// PM2 wrapper for Next.js dev on Windows - avoids path/SyntaxError issues
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3000';
const cwd = process.env.PM2_CWD || process.cwd();
const nextPath = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(process.execPath, [nextPath, 'dev', '-p', port], {
  stdio: 'inherit',
  cwd,
  env: { ...process.env, FORCE_COLOR: '1' }
});
child.on('exit', (code) => process.exit(code || 0));
