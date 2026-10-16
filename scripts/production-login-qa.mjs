import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const checks = [];
for (const flag of [undefined, '0', '1']) {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const env = { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' };
  if (flag === undefined) delete env.ENABLE_DEMO_LOGIN;
  else env.ENABLE_DEMO_LOGIN = flag;
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env, windowsHide: true, stdio: 'ignore' });
  const closed = once(child, 'close');
  try {
    const base = `http://127.0.0.1:${port}`;
    const started = Date.now();
    while (true) {
      if (child.exitCode !== null || Date.now() - started > 30000) throw new Error('Production test server did not start');
      try {
        await fetch(`${base}/api/auth/dev-login`, { signal: AbortSignal.timeout(1000), redirect: 'manual' });
        break;
      } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    for (const email of ['owner@masra.local', 'admin@masra.local', 'teacher@masra.local', 'guardian@masra.local', 'supervisor@masra.local', 'student@masra.local']) {
      const response = await fetch(`${base}/api/auth/dev-login?email=${encodeURIComponent(email)}`, { redirect: 'manual', signal: AbortSignal.timeout(5000) });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get('set-cookie'), null);
      checks.push({ flag: flag ?? 'unset', account: email.split('@')[0], status: response.status, noSessionCookie: true });
    }
  } finally { child.kill(); await closed; }
}
await writeFile('../../outputs/production-login-qa.json', JSON.stringify(checks, null, 2));
console.log(`${checks.length} production HTTP checks passed; all temporary servers stopped.`);
