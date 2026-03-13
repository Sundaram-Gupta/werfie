// PM2 wrapper for Vite on Windows - avoids script path issues
const { spawn } = require('child_process');
const path = require('path');

const vitePath = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const child = spawn(process.execPath, [vitePath, '--port', '5173', '--host'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env, FORCE_COLOR: '1' }
});
child.on('exit', (code) => process.exit(code || 0));
