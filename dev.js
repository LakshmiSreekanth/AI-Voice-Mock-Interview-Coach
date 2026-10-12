const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('🚀 IntervAI — AI Technical & Voice Interview Coach');
console.log('====================================================');

// Helper to kill any orphaned process occupying ports 3000 or 5000 on Windows
function freePorts() {
  try {
    const ports = [3000, 5000];
    for (const port of ports) {
      try {
        const stdout = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`🧹 Cleaned up old process (${pid}) on port ${port}`);
            } catch {}
          }
        }
      } catch {}
    }
  } catch {}
}

freePorts();

console.log('\n[1/2] Starting Express API Server (Port 5000)...');
console.log('[2/2] Starting React Dev Server (Port 3000)...\n');

const nodeBin = process.execPath;
const webpackBin = path.join(__dirname, 'node_modules', 'webpack', 'bin', 'webpack.js');

// 1. Backend process
const server = spawn(nodeBin, [path.join(__dirname, 'server', 'index.js')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: 5000 }
});

// 2. Frontend process
const client = spawn(nodeBin, [webpackBin, 'serve', '--mode', 'development'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: 3000 }
});

server.on('error', (err) => console.error('[BACKEND ERROR]', err));
client.on('error', (err) => console.error('[FRONTEND ERROR]', err));

server.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`[BACKEND EXITED WITH CODE ${code}]`);
  }
});

client.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`[FRONTEND EXITED WITH CODE ${code}]`);
  }
});

// Keep main process active
const keepAlive = setInterval(() => {}, 10000);

const shutdown = () => {
  console.log('\n🛑 Stopping IntervAI servers...');
  clearInterval(keepAlive);
  try { server.kill('SIGTERM'); } catch {}
  try { client.kill('SIGTERM'); } catch {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
