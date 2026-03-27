#!/usr/bin/env node
/**
 * PM2 entry for adminBackend: use `next dev` so :3012 works without `next build`
 * (run-next-dev.cjs uses `next start`, which needs .next/BUILD_ID and crash-loops otherwise).
 */
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3012';
const cwd = process.cwd();
const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(
    process.execPath,
    [nextBin, 'dev', '-p', port, '--hostname', '127.0.0.1'],
    {
        stdio: 'inherit',
        cwd,
        env: { ...process.env, FORCE_COLOR: '1' },
    }
);
child.on('exit', (code) => process.exit(code || 0));
