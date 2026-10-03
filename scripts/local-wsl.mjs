import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true });
const db = new URL(process.env.DATABASE_URL ?? '');
if (db.hostname !== '127.0.0.1' || db.port !== '5433' || db.pathname !== '/masra_local_dev' || db.username !== 'masra_local') throw new Error('Unexpected local database. Refusing to continue.');
const action = process.argv[2] ?? 'start';
if (!['start', 'db', 'backup', 'stop-db', 'setup'].includes(action)) throw new Error('Unknown local action.');
if (action === 'setup') throw new Error('Database already restored. Automatic seeding is disabled; apply reviewed migrations separately.');
function wsl(user, args, options = {}) {
  const result = spawnSync('wsl.exe', ['-d', 'MASRA-Dev', '-u', user, '--', ...args], { cwd: root, windowsHide: true, stdio: 'inherit', timeout: 60000, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('WSL database command failed.');
  return result;
}
if (action === 'stop-db') {
  wsl('root', ['pg_ctlcluster', '17', 'main', 'stop']);
} else {
  wsl('root', ['systemctl', 'start', 'postgresql@17-main']);
  const client = new pg.Client({ connectionString: db.href, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const { rows } = await client.query("SELECT current_database() AS db, current_user AS usr, (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser");
    if (rows[0].db !== 'masra_local_dev' || rows[0].usr !== 'masra_local' || rows[0].superuser) throw new Error('Unexpected database identity or privileges.');
    await client.query('SELECT count(*) FROM organizations');
  } finally { await client.end(); }
  if (action === 'backup') {
    const folder = path.join(root, '.local', 'backups');
    mkdirSync(folder, { recursive: true });
    const file = path.join(folder, `masra-wsl-${new Date().toISOString().replaceAll(':', '-')}.dump`);
    const linuxPath = '/mnt/' + file[0].toLowerCase() + file.slice(2).replaceAll('\\', '/');
    wsl('postgres', ['pg_dump', '-p', '5433', '-d', 'masra_local_dev', '-Fc', '-f', linuxPath + '.partial']);
    wsl('postgres', ['pg_restore', '--list', linuxPath + '.partial'], { stdio: 'ignore' });
    renameSync(file + '.partial', file);
    console.log('Backup saved:', file);
  } else if (action === 'start') {
    console.log('MASRA: http://localhost:3000/login — local synthetic data only');
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3000'], { cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'inherit', windowsHide: true });
    child.on('error', error => { console.error(error.message); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code ?? 1; });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  }
}
