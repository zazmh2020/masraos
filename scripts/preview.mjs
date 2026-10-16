import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true });
const db = new URL(process.env.DATABASE_URL ?? '');
if (db.hostname !== '127.0.0.1' || db.port !== '5433' || db.pathname !== '/masra_preview_20261013' || db.username !== 'masra_preview') {
  throw new Error('This launcher only accepts the isolated local preview database.');
}
const base = 'http://127.0.0.1:3017';
const startDb = spawnSync('wsl.exe', ['-d', 'MASRA-Dev', '-u', 'root', '--', 'systemctl', 'start', 'postgresql@17-main'], { windowsHide: true, stdio: 'inherit', timeout: 60000 });
if (startDb.error || startDb.status !== 0) throw new Error('Could not start the existing local database environment.');
// WSL may stop an idle distribution despite its systemd services; retain a process.
const keeper = spawn('wsl.exe', ['-d', 'MASRA-Dev', '-u', 'postgres', '--', 'sleep', 'infinity'], { windowsHide: true, detached: true, stdio: 'ignore' });
keeper.unref();
try {
  const response = await fetch(`${base}/login`, { signal: AbortSignal.timeout(1500) });
  if (response.ok) { console.log(`MASRA is already running: ${base}`); process.exit(0); }
} catch { /* start the requested preview */ }

const child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '3017'], { cwd: root, windowsHide: true, stdio: 'inherit', env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' } });
console.log(`MASRA local preview: ${base}`);
child.on('error', error => { keeper.kill(); console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { keeper.kill(); process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(); keeper.kill(); });
