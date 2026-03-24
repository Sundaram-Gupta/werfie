const { execSync, spawn } = require('child_process');
const path = require('path');

const AUTH_PORT = Number(process.env.PORT || 3001);
const authServiceDir = path.join(__dirname, '..', 'apps', 'backend', 'auth-service-js');

function readCommandLineForPid(pid) {
  try {
    const ps = `powershell -NoProfile -Command "(Get-CimInstance Win32_Process -Filter \\"ProcessId=${pid}\\").CommandLine"`;
    return execSync(ps, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function getListeningPids(port) {
  try {
    const cmd = `netstat -ano -p tcp | findstr ":${port}" | findstr "LISTENING"`;
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/).pop())
      .map((pid) => Number(pid))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    console.log(`[auth-guard] Killed stale PID ${pid} on port ${AUTH_PORT}`);
    return true;
  } catch {
    return false;
  }
}

function cleanupStalePortListeners() {
  const pids = getListeningPids(AUTH_PORT);
  if (pids.length === 0) {
    console.log(`[auth-guard] Port ${AUTH_PORT} is free`);
    return;
  }

  for (const pid of pids) {
    const cmdline = readCommandLineForPid(pid).toLowerCase();
    const looksLikeStaleAuth = cmdline.includes('node') && cmdline.includes('server.js');
    if (looksLikeStaleAuth) {
      killPid(pid);
    } else {
      console.log(`[auth-guard] Port ${AUTH_PORT} in use by PID ${pid}; skipped (not server.js)`);
    }
  }
}

cleanupStalePortListeners();

const child = spawn(process.execPath, ['server.js'], {
  cwd: authServiceDir,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
