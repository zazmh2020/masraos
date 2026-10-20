import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { halaqa: { findMany: mocks.findMany } } }));

import {
  getStudentScope, halaqaScopeWhere, isTeacherScoped, studentRelationWhere, studentScopeWhere, type StudentScope,
} from './access-scope';
import { canGrantCaps, isUnrestrictedAdmin } from './permissions';

describe('teacher scope (H2: halaqat of the teacher only)', () => {
  beforeEach(() => mocks.findMany.mockReset());

  it('applies only to the TEACHER base role', async () => {
    for (const role of ['ORG_ADMIN', 'SUPERVISOR', 'STAFF', 'MEMBER', 'STUDENT', 'PLATFORM_OWNER']) {
      expect(isTeacherScoped({ id: 'u', role })).toBe(false);
      expect(await getStudentScope({ id: 'u', role }, 'org')).toEqual({ restricted: false });
    }
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('loads the teacher halaqat through Teacher.userId inside the organization', async () => {
    mocks.findMany.mockResolvedValue([{ id: 'h1' }, { id: 'h2' }]);
    const scope = await getStudentScope({ id: 'user-1', role: 'TEACHER' }, 'org-1');
    expect(scope).toEqual({ restricted: true, halaqaIds: ['h1', 'h2'] });
    expect(mocks.findMany).toHaveBeenCalledWith({ where: { organizationId: 'org-1', teacher: { userId: 'user-1' } }, select: { id: true } });
  });

  it('a teacher without a Teacher record or halaqat sees nothing (empty list, never everything)', async () => {
    mocks.findMany.mockResolvedValue([]);
    const scope = await getStudentScope({ id: 'user-1', role: 'TEACHER' }, 'org-1');
    expect(scope).toEqual({ restricted: true, halaqaIds: [] });
    expect(studentScopeWhere(scope)).toEqual({ halaqaId: { in: [] } });
  });

  it('where builders add nothing for an unrestricted actor and constrain a restricted one', () => {
    const open: StudentScope = { restricted: false };
    const closed: StudentScope = { restricted: true, halaqaIds: ['h1'] };
    expect(studentScopeWhere(open)).toEqual({});
    expect(halaqaScopeWhere(open)).toEqual({});
    expect(studentRelationWhere(open)).toEqual({});
    expect(studentScopeWhere(closed)).toEqual({ halaqaId: { in: ['h1'] } });
    expect(halaqaScopeWhere(closed)).toEqual({ id: { in: ['h1'] } });
    expect(studentRelationWhere(closed)).toEqual({ student: { halaqaId: { in: ['h1'] } } });
  });
});

describe('delegated user management (H1)', () => {
  it('only an unrestricted organization admin (or the platform owner) is an unrestricted admin', () => {
    expect(isUnrestrictedAdmin({ role: 'ORG_ADMIN' })).toBe(true);
    expect(isUnrestrictedAdmin({ role: 'ORG_ADMIN', permissions: null })).toBe(true);
    expect(isUnrestrictedAdmin({ role: 'PLATFORM_OWNER' })).toBe(true);
    expect(isUnrestrictedAdmin({ role: 'ORG_ADMIN', permissions: ['users.manage'] })).toBe(false);
    expect(isUnrestrictedAdmin({ role: 'STAFF', permissions: ['users.manage'] })).toBe(false);
    expect(isUnrestrictedAdmin({ role: 'STAFF' })).toBe(false);
  });

  it('a delegate can grant only capabilities they hold themselves', () => {
    const delegate = { role: 'STAFF', permissions: ['users.view', 'users.manage'] };
    expect(canGrantCaps(delegate, ['users.view'])).toBe(true);
    expect(canGrantCaps(delegate, ['users.view', 'users.manage'])).toBe(true);
    expect(canGrantCaps(delegate, ['settings.manage'])).toBe(false);
    expect(canGrantCaps(delegate, ['users.view', 'finance.manage'])).toBe(false);
    expect(canGrantCaps({ role: 'ORG_ADMIN' }, ['settings.manage', 'finance.manage'])).toBe(true);
  });
});
