import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => Object.fromEntries(['announcement', 'user', 'task', 'memberRequest', 'donation', 'student'].map(name => [name, { findMany: vi.fn() }])));
vi.mock('@/lib/prisma', () => ({ prisma: queries }));
vi.mock('@/lib/i18n/server', () => ({ getT: async () => ({ t: (_key: string, vars: Record<string, string>) => Object.values(vars).join(' ') }) }));
import { getOrgInbox } from './inbox';

beforeEach(() => { for (const model of Object.values(queries)) model.findMany.mockReset().mockResolvedValue([]); });

describe('notification privacy', () => {
  it('does not fetch or disclose student, donor or user records to an ordinary member', async () => {
    queries.student.findMany.mockResolvedValue([{ id: 'private-student', name: 'Private student', createdAt: new Date() }]);
    queries.donation.findMany.mockResolvedValue([{ id: 'private-donor', donorName: 'Private donor', donatedAt: new Date() }]);
    const inbox = await getOrgInbox('center-a', { id: 'guardian-user', role: 'MEMBER' });
    expect(queries.student.findMany).not.toHaveBeenCalled();
    expect(queries.donation.findMany).not.toHaveBeenCalled();
    expect(queries.user.findMany).not.toHaveBeenCalled();
    expect(inbox.notifications.some(n => ['student', 'donation', 'member'].includes(n.type))).toBe(false);
    expect(queries.memberRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'center-a', requesterId: 'guardian-user' } }));
  });
  it('preserves authorized student and donation notifications for administrators', async () => {
    queries.student.findMany.mockResolvedValue([{ id: 'student', name: 'Authorized student', createdAt: new Date() }]);
    queries.donation.findMany.mockResolvedValue([{ id: 'donor', donorName: 'Authorized donor', donatedAt: new Date() }]);
    const inbox = await getOrgInbox('center-a', { id: 'manager', role: 'ORG_ADMIN' });
    expect(inbox.notifications.map(n => n.type)).toEqual(expect.arrayContaining(['student', 'donation']));
  });
});
