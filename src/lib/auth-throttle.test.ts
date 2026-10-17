import { beforeEach, describe, expect, it, vi } from 'vitest';

// المخزن المركزي معطّل عمدًا: كل استعلام يفشل كما لو أن الجدول غير موجود.
const m = vi.hoisted(() => ({ report: vi.fn() }));
vi.mock('@/lib/prisma', () => {
  const fail = async () => { throw new Error('relation "auth_throttles" does not exist'); };
  return { prisma: { $queryRaw: fail, authThrottle: { findMany: fail, deleteMany: fail } } };
});
vi.mock('@/lib/observe', () => ({ reportError: m.report }));
process.env.AUTH_SECRET ??= 'unit-test-secret';

import { __resetThrottleMemory, blockedFor, clear, hit } from './auth-throttle';

const RULE = { limit: 5, windowSec: 900, blockSec: 900 };

describe('throttle fallback when the central store is unavailable', () => {
  beforeEach(() => { __resetThrottleMemory(); m.report.mockReset(); });

  it('still blocks after the limit instead of failing open', async () => {
    for (let i = 1; i <= 4; i++) expect((await hit('k', RULE)).blocked).toBe(false);
    expect((await hit('k', RULE)).blocked).toBe(true);
    expect(await blockedFor(['k'])).toBeGreaterThan(800);
  });

  it('keeps keys independent and clears on success', async () => {
    for (let i = 0; i < 5; i++) await hit('a', RULE);
    expect(await blockedFor(['b'])).toBe(0);
    await clear(['a']);
    expect(await blockedFor(['a'])).toBe(0);
  });

  it('reports the degraded mode, at most once a minute', async () => {
    await hit('x', RULE); await hit('x', RULE); await blockedFor(['x']);
    expect(m.report).toHaveBeenCalledTimes(1);
    expect(m.report.mock.calls[0][0].message).toContain('IN MEMORY');
  });
});
