import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

/* ============================================================
   استعادة كلمة المرور — رمز عشوائي 256 بت يُرسل للبريد مرة واحدة؛
   يُخزَّن منه بصمة SHA-256 فقط، صالح 30 دقيقة، يُستهلك ذريًا مرة واحدة،
   ونجاحه يبطل كل جلسات المستخدم (sessionVersion) وكل رموزه الأخرى.
   ============================================================ */

export const RESET_TTL_MS = 30 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8; // مطابق لسياسة تغيير كلمة المرور الحالية

export const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** ينشئ رمزًا جديدًا ويبطل أي رمز سابق غير مستعمل لنفس المستخدم. يعيد الرمز الخام (للبريد فقط). */
export async function issueResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId, tokenHash: hashResetToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
  ]);
  return token;
}

export type ResetResult = { ok: true } | { ok: false; reason: 'invalid' | 'weak' };

/**
 * يستهلك الرمز ويضبط كلمة المرور الجديدة — ذريًا: قفل صف الرمز ثم فحص صلاحيته،
 * فطلبان متزامنان بنفس الرمز لا ينجح إلا أحدهما.
 */
export async function resetPassword(token: string, newPassword: string): Promise<ResetResult> {
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > 1024) {
    return { ok: false, reason: 'weak' };
  }
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) return { ok: false, reason: 'invalid' };
  const tokenHash = hashResetToken(token);
  const passwordHash = await bcrypt.hash(newPassword, 12); // خارج المعاملة لتقصير القفل

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; userId: string; expiresAt: Date; usedAt: Date | null }[]>`
      SELECT "id", "userId", "expiresAt", "usedAt" FROM "password_reset_tokens" WHERE "tokenHash" = ${tokenHash} FOR UPDATE`;
    const row = rows[0];
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) return { ok: false, reason: 'invalid' } as const;

    const user = await tx.user.findUnique({ where: { id: row.userId }, select: { isActive: true } });
    if (!user?.isActive) return { ok: false, reason: 'invalid' } as const;

    const now = new Date();
    await tx.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } });
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    return { ok: true } as const;
  });
}

/**
 * رابط الاستعادة من النطاق المضبوط في البيئة — لا من ترويسة Host (يمنع حقن المضيف
 * الذي يرسل الرمز لنطاق المهاجم). في التطوير فقط يُقبل أصل الطلب.
 */
export function resetUrl(token: string, requestUrl: string): string | null {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
  const base = domain
    ? `https://${domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
    : process.env.NODE_ENV !== 'production' ? new URL(requestUrl).origin : null;
  return base ? `${base}/reset-password?token=${encodeURIComponent(token)}` : null;
}
