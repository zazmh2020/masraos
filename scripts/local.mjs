import { spawnSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(path.join(root, '.local', 'wsl-enabled'))) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'local-wsl.mjs'), ...process.argv.slice(2)], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
dotenv.config({ path: path.join(root, '.env.local'), override: true, quiet: true });
const db = new URL(process.env.DATABASE_URL ?? '');
if (db.hostname !== '127.0.0.1' || db.port !== '5433' || db.pathname !== '/masra_local_dev') {
  throw new Error('Local commands refuse to operate on a remote or unexpected database.');
}
const bin = path.join(root, '.local', 'pgsql', 'bin');
const data = path.join(root, '.local', 'pgdata');
const ctl = path.join(bin, 'pg_ctl.exe');
const action = process.argv[2] ?? 'start';
const env = { ...process.env, PGPASSWORD: decodeURIComponent(db.password), PGCONNECT_TIMEOUT: '3', NEXT_TELEMETRY_DISABLED: '1' };
function run(exe, args, options = {}) {
  const r = spawnSync(exe, args, { cwd: root, env, stdio: 'inherit', windowsHide: true, ...options });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`Local command failed (${r.status}).`);
  return r;
}
function startDatabase() {
  if (!existsSync(ctl)) throw new Error('PostgreSQL binaries missing from .local/pgsql. See docs/LOCAL_DEVELOPMENT.md.');
  const ready = spawnSync(path.join(bin, 'pg_isready.exe'), ['-h', '127.0.0.1', '-p', '5433', '-t', '2'], { env, stdio: 'ignore', windowsHide: true });
  if (ready.status === 0) {
    const identity = spawnSync(path.join(bin, 'psql.exe'), ['-h', '127.0.0.1', '-p', '5433', '-U', 'masra_local', '-d', 'postgres', '-Atc', 'SHOW data_directory'], { env, encoding: 'utf8', windowsHide: true });
    const normalize = value => value.trim().replaceAll('\\', '/').toLowerCase();
    if (identity.status !== 0 || normalize(identity.stdout) !== normalize(data)) throw new Error('Port 5433 belongs to another database. Nothing was changed.');
    return;
  }
  if (!existsSync(path.join(data, 'PG_VERSION'))) {
    run(path.join(bin, 'initdb.exe'), ['-D', data, '-U', 'masra_local', '-A', 'scram-sha-256', '--pwfile=' + path.join(root, '.local', 'pg-password.txt'), '-E', 'UTF8', '--locale=C']);
  }
  const status = spawnSync(ctl, ['-D', data, 'status'], { cwd: root, env, stdio: 'ignore', windowsHide: true });
  if (status.status !== 0) run(ctl, ['-D', data, '-l', path.join(root, '.local', 'postgres.log'), '-o', '-h 127.0.0.1 -p 5433', '-w', 'start']);
}
if (action === 'stop-db') {
  run(ctl, ['-D', data, '-m', 'fast', '-w', 'stop']);
} else if (action === 'backup') {
  startDatabase();
  const folder = path.join(root, '.local', 'backups'); mkdirSync(folder, { recursive: true });
  const file = path.join(folder, `masra-${new Date().toISOString().replaceAll(':', '-')}.dump`);
  run(path.join(bin, 'pg_dump.exe'), ['-h', '127.0.0.1', '-p', '5433', '-U', 'masra_local', '-d', 'masra_local_dev', '-Fc', '-f', file]);
  console.log('Local backup saved:', file);
} else {
  startDatabase();
  if (action === 'setup') {
    const result = spawnSync(path.join(bin, 'psql.exe'), ['-h', '127.0.0.1', '-p', '5433', '-U', 'masra_local', '-d', 'postgres', '-Atc', "SELECT 1 FROM pg_database WHERE datname='masra_local_dev'"], { cwd: root, env, encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error('Cannot connect to local PostgreSQL.');
    if (result.stdout.trim() !== '1') run(path.join(bin, 'createdb.exe'), ['-h', '127.0.0.1', '-p', '5433', '-U', 'masra_local', 'masra_local_dev']);
    run(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
    run(process.execPath, ['node_modules/prisma/build/index.js', 'generate']);
    run(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'prisma/seed-local.ts']);
  } else if (action === 'start') {
    console.log('MASRA local preview: http://localhost:3000/login (synthetic local data only)');
    const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3000'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
    child.on('exit', code => { process.exitCode = code ?? 0; });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  } else if (action !== 'db') throw new Error('Unknown local action.');
}
