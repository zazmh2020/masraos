import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), user: vi.fn() }));
vi.mock('@/lib/session', () => ({ getSession: mocks.session }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.user } } }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
import { getVerifiedSession } from './session-guard';

const owner = { userId: 'p1', email: 'owner@example.test', name: 'Owner', role: 'PLATFORM_OWNER', organizationId: null, organizationSlug: null, sessionVersion: 2 };
const ownerRow = { id: 'p1', email: 'owner@example.test', name: 'Owner', role: 'PLATFORM_OWNER', isActive: true, sessionVersion: 2, organizationId: null, organization: null };
const teacher = { userId: 'u1', email: 't@example.test', name: 'T', role: 'TEACHER', organizationId: 'org-a', organizationSlug: 'center-a', sessionVersion: 0 };
const teacherRow = { id: 'u1', email: 't@example.test', name: 'T', role: 'TEACHER', isActive: true, sessionVersion: 0, organizationId: 'org-a', organization: { id: 'org-a', slug: 'center-a', isActive: true } };

beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue(owner); mocks.user.mockResolvedValue(ownerRow); });

describe('database-verified session', () => {
  it('accepts a current platform-owner session', async () => {
    expect(await getVerifiedSession()).toMatchObject({ userId: 'p1', role: 'PLATFORM_OWNER' });
  });
  it('returns null without reading users when there is no cookie', async () => {
    mocks.session.mockResolvedValue(null);
    expect(await getVerifiedSession()).toBeNull(); expect(mocks.user).not.toHaveBeenCalled();
  });
  it('takes the role from the database, not the cookie (demoted owner loses admin)', async () => {
    mocks.user.mockResolvedValue({ ...ownerRow, role: 'MEMBER' });
    expect((await getVerifiedSession())?.role).toBe('MEMBER');
  });
  it('rejects a disabled account immediately', async () => {
    mocks.user.mockResolvedValue({ ...ownerRow, isActive: false });
    expect(await getVerifiedSession()).toBeNull();
  });
  it('rejects a revoked session after a version bump', async () => {
    mocks.user.mockResolvedValue({ ...ownerRow, sessionVersion: 3 });
    expect(await getVerifiedSession()).toBeNull();
  });
  it('rejects deleted accounts', async () => {
    mocks.user.mockResolvedValue(null);
    expect(await getVerifiedSession()).toBeNull();
  });
  it('accepts an active organization member and rejects a disabled or moved organization', async () => {
    mocks.session.mockResolvedValue(teacher); mocks.user.mockResolvedValue(teacherRow);
    expect(await getVerifiedSession()).not.toBeNull();
    mocks.user.mockResolvedValue({ ...teacherRow, organization: { ...teacherRow.organization, isActive: false } });
    expect(await getVerifiedSession()).toBeNull();
    mocks.user.mockResolvedValue({ ...teacherRow, organizationId: 'org-b', organization: { id: 'org-b', slug: 'center-a', isActive: true } });
    expect(await getVerifiedSession()).toBeNull();
    mocks.user.mockResolvedValue({ ...teacherRow, organization: { ...teacherRow.organization, slug: 'renamed' } });
    expect(await getVerifiedSession()).toBeNull();
  });
});
