import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

/** Both verification and resend must read their state AFTER acquiring this row lock. */
export function withSignupRequestLock<T>(id: string, action: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM signup_requests WHERE id = ${id} FOR UPDATE`;
    return action(tx);
  });
}
