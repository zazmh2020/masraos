import { cache } from 'react';
import { canViewUsers, canViewTasks, canViewRequests, canManageRequests, canViewDonations, canViewEducation, canSeeDonors, type Actor } from '@/lib/permissions';
import { DONOR_MASK } from '@/lib/sensitive-fields';
import { prisma } from '@/lib/prisma';
import { getT } from '@/lib/i18n/server';

/* ============================================================
   صندوق الوارد — رسائل (إعلانات الجهة) + إشعارات (نشاط حديث)
   يُحسب من البيانات الفعلية (لا جداول جديدة).
   ============================================================ */

export interface InboxMessage {
  id: string;
  title: string;
  body: string;
  time: string; // ISO
  pinned: boolean;
}

export interface InboxNotification {
  id: string;
  type: 'member' | 'announcement' | 'task' | 'request' | 'donation' | 'student';
  title: string;
  time: string; // ISO
}

export interface OrgInbox {
  messages: InboxMessage[];
  notifications: InboxNotification[];
}

/** صندoق وارد مالك المنصّة — من المؤسسات والمستخدمين الأحدث (بيانات فعلية). */
export async function getAdminInbox(): Promise<OrgInbox> {
  const [orgs, users] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, slug: true, plan: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
  ]);

  const messages: InboxMessage[] = orgs.map((o) => ({
    id: o.id,
    title: o.name,
    body: `النطاق: ${o.slug} · الباقة: ${o.plan}`,
    time: o.createdAt.toISOString(),
    pinned: false,
  }));

  const notifications: InboxNotification[] = [
    ...orgs.slice(0, 5).map((o) => ({
      id: `org-${o.id}`,
      type: 'announcement' as const,
      title: `مؤسسة جديدة: ${o.name}`,
      time: o.createdAt.toISOString(),
    })),
    ...users.map((u) => ({
      id: `usr-${u.id}`,
      type: 'member' as const,
      title: `مستخدم جديد: ${u.name}`,
      time: u.createdAt.toISOString(),
    })),
  ]
    .sort((x, y) => (x.time < y.time ? 1 : -1))
    .slice(0, 8);

  return { messages, notifications };
}

export const getOrgInbox = cache(async (organizationId: string, actor: Actor & { id: string }): Promise<OrgInbox> => {
  const where = { organizationId };
  const { t } = await getT();
  const [announcements, members, tasks, requests, donations, students] = await Promise.all([
    prisma.announcement.findMany({
      where: { organizationId, isPublished: true },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: 8,
    }),
    canViewUsers(actor) ? prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, createdAt: true } }) : Promise.resolve([]),
    canViewTasks(actor) ? prisma.task.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, createdAt: true } }) : Promise.resolve([]),
    canViewRequests(actor) ? prisma.memberRequest.findMany({
      where: { ...where, ...(canManageRequests(actor) ? {} : { requesterId: actor.id }) }, orderBy: { createdAt: 'desc' }, take: 5,
      select: { id: true, type: true, status: true, createdAt: true, requester: { select: { name: true } } },
    }) : Promise.resolve([]),
    canViewDonations(actor) ? prisma.donation.findMany({ where, orderBy: { donatedAt: 'desc' }, take: 5, select: { id: true, donorName: true, donatedAt: true } }) : Promise.resolve([]),
    canViewEducation(actor) ? prisma.student.findMany({ where, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, createdAt: true } }) : Promise.resolve([]),
  ]);

  const messages: InboxMessage[] = announcements.map((a) => ({
    id: a.id, title: a.title, body: a.body, time: a.createdAt.toISOString(), pinned: a.pinned,
  }));

  const notifications: InboxNotification[] = [
    ...announcements.slice(0, 4).map((a) => ({
      id: `ann-${a.id}`, type: 'announcement' as const,
      title: t('inbox.newAnnouncement', { v: a.title }), time: a.createdAt.toISOString(),
    })),
    ...members.map((m) => ({
      id: `usr-${m.id}`, type: 'member' as const,
      title: t('inbox.newMember', { name: m.name }), time: m.createdAt.toISOString(),
    })),
    ...tasks.map((tk) => ({
      id: `tsk-${tk.id}`, type: 'task' as const,
      title: t('inbox.newTask', { v: tk.title }), time: tk.createdAt.toISOString(),
    })),
    ...requests.map((r) => ({
      id: `req-${r.id}`, type: 'request' as const,
      title: t('inbox.newRequest', { name: r.requester.name, v: t(`req.type.${r.type}`) }),
      time: r.createdAt.toISOString(),
    })),
    ...donations.map((d) => ({
      id: `don-${d.id}`, type: 'donation' as const,
      title: t('inbox.newDonation', { name: canSeeDonors(actor) ? d.donorName : DONOR_MASK }), time: d.donatedAt.toISOString(),
    })),
    ...students.map((s) => ({
      id: `std-${s.id}`, type: 'student' as const,
      title: t('inbox.newStudent', { name: s.name }), time: s.createdAt.toISOString(),
    })),
  ]
    .sort((x, y) => (x.time < y.time ? 1 : -1))
    .slice(0, 12);

  return { messages, notifications };
});
