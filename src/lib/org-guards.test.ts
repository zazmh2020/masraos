import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ session: vi.fn(), user: vi.fn() }));
vi.mock('@/lib/session', () => ({ getSession: mocks.session }));
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mocks.user } } }));
// No request cache in isolated guard tests.
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
import { getOrgActor, getOrgContext } from './org';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ userId: 'u1', organizationId: 'org-a', organizationSlug: 'center-a', sessionVersion: 0 });
  mocks.user.mockResolvedValue({ id: 'u1', isActive: true, sessionVersion: 0, role: 'TEACHER', organizationId: 'org-a', organization: { id: 'org-a', slug: 'center-a', isActive: true }, customRole: null });
});
describe('organization guard boundaries', () => {
  it('accepts an active matching organization', async () => {
    expect(await getOrgContext('center-a')).not.toBeNull(); expect(await getOrgActor()).not.toBeNull();
  });
  it('denies absent sessions without reading users', async () => {
    mocks.session.mockResolvedValue(null);
    expect(await getOrgContext('center-a')).toBeNull(); expect(await getOrgActor()).toBeNull(); expect(mocks.user).not.toHaveBeenCalled();
  });
  it('denies a URL for a different organization', async () => {
    expect(await getOrgContext('center-b')).toBeNull(); expect(mocks.user).not.toHaveBeenCalled();
  });
  it('denies disabled users immediately', async () => {
    const user = await mocks.user(); mocks.user.mockResolvedValue({ ...user, isActive: false });
    expect(await getOrgContext('center-a')).toBeNull(); expect(await getOrgActor()).toBeNull();
  });
  it('denies disabled organizations immediately', async () => {
    const user = await mocks.user(); mocks.user.mockResolvedValue({ ...user, organization: { ...user.organization, isActive: false } });
    expect(await getOrgContext('center-a')).toBeNull(); expect(await getOrgActor()).toBeNull();
  });
  it('denies a stale session even if the slug is reused by another organization', async () => {
    const user = await mocks.user(); mocks.user.mockResolvedValue({ ...user, organizationId: 'org-b', organization: { ...user.organization, id: 'org-b' } });
    expect(await getOrgContext('center-a')).toBeNull(); expect(await getOrgActor()).toBeNull();
  });
  it('denies a session revoked by a password, role or status change', async () => {
    const user = await mocks.user(); mocks.user.mockResolvedValue({ ...user, sessionVersion: 1 });
    expect(await getOrgContext('center-a')).toBeNull(); expect(await getOrgActor()).toBeNull();
  });
  it('denies deleted accounts', async () => {
    mocks.user.mockResolvedValue(null); expect(await getOrgContext('center-a')).toBeNull(); expect(await getOrgActor()).toBeNull();
  });
});
