import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageRegistration } from '@/lib/student-registration';
import { isS3Configured, putStudentPhoto, readStudentPhoto } from '@/lib/s3';

const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
type Context = { params: Promise<{ id: string }> };
async function context(params: Context['params']) {
  const actor = await getOrgActor();
  if (!actor || !canManageRegistration(actor)) return { error: NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 }) };
  const { id } = await params;
  const student = await prisma.student.findFirst({ where: { id, organizationId: actor.organization.id },
    select: { id: true, registration: { select: { photoKey: true, consentConfirmed: true } } } });
  if (!student) return { error: NextResponse.json({ error: 'الطالب غير موجود.' }, { status: 404 }) };
  return { actor, student };
}

export async function GET(_request: Request, { params }: Context) {
  const ctx = await context(params);
  if (ctx.error) return ctx.error;
  const key = ctx.student.registration?.photoKey;
  const prefix = `student-photos/${ctx.actor.organization.id}/${ctx.student.id}/`;
  if (!key?.startsWith(prefix)) return new Response(null, { status: 404, headers: privateHeaders });
  if (!isS3Configured()) return new Response(null, { status: 503, headers: privateHeaders });
  try {
    const bytes = await readStudentPhoto(key);
    if (!bytes) return new Response(null, { status: 404, headers: privateHeaders });
    return new Response(Buffer.from(bytes), { headers: { ...privateHeaders, 'Content-Type': 'image/jpeg' } });
  } catch { return new Response(null, { status: 503, headers: privateHeaders }); }
}

export async function POST(request: Request, { params }: Context) {
  const ctx = await context(params);
  if (ctx.error) return ctx.error;
  if (!ctx.student.registration?.consentConfirmed) return NextResponse.json({ error: 'احفظ الاستمارة مع تأكيد موافقة ولي الأمر أولًا.' }, { status: 400 });
  if (!isS3Configured()) return NextResponse.json({ error: 'تخزين الصور الخاص غير مُعدّ. يمكن حفظ الاستمارة دون صورة.' }, { status: 503 });
  // Read with a hard cap, even when Content-Length is missing or dishonest.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: 'الصورة مطلوبة.' }, { status: 400 });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2 * 1024 * 1024) { await reader.cancel(); return NextResponse.json({ error: 'الحد الأقصى للصورة 2 ميجابايت.' }, { status: 413 }); }
    chunks.push(value);
  }
  let photo: Buffer;
  try {
    const raw = Buffer.concat(chunks);
    const img = sharp(raw, { limitInputPixels: 16_000_000 });
    const metadata = await img.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new Error('format');
    // Re-encode to strip EXIF/GPS metadata and reject active formats such as SVG.
    photo = await img.rotate().resize(600, 800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  } catch { return NextResponse.json({ error: 'اختر صورة JPEG أو PNG أو WebP سليمة.' }, { status: 400 }); }
  const key = `student-photos/${ctx.actor.organization.id}/${ctx.student.id}/${randomUUID()}.jpg`;
  try { await putStudentPhoto(key, photo); }
  catch { return NextResponse.json({ error: 'تعذر حفظ الصورة في التخزين الخاص. حاول لاحقًا.' }, { status: 503 }); }
  await prisma.$transaction([
    prisma.studentRegistration.update({ where: { studentId: ctx.student.id }, data: { photoKey: key, updatedByName: ctx.actor.name } }),
    prisma.auditLog.create({ data: { organizationId: ctx.actor.organization.id, actorName: ctx.actor.name, action: 'UPLOAD_PHOTO', entity: 'StudentRegistration', label: ctx.student.id } }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Context) {
  const ctx = await context(params);
  if (ctx.error) return ctx.error;
  if (!ctx.student.registration?.photoKey) return NextResponse.json({ ok: true });
  // Detach only; existing stored objects are not destructively deleted by this feature.
  await prisma.$transaction([
    prisma.studentRegistration.update({ where: { studentId: ctx.student.id }, data: { photoKey: null, updatedByName: ctx.actor.name } }),
    prisma.auditLog.create({ data: { organizationId: ctx.actor.organization.id, actorName: ctx.actor.name, action: 'DETACH_PHOTO', entity: 'StudentRegistration', label: ctx.student.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
