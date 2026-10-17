import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getOrgActor } from '@/lib/org';
import { canManageDocuments } from '@/lib/permissions';
import { isS3Configured, presignUpload, orgObjectPrefix } from '@/lib/s3';
import { MAX_DOCUMENT_BYTES, resolveDocumentType, safeStorageName } from '@/lib/upload-policy';

/** يطلب رابط رفع موقّعًا على النوع والحجم؛ المفتاح معزول بالمؤسسة */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageDocuments(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  if (!isS3Configured()) {
    return NextResponse.json({ error: 'التخزين غير مُعدّ. أضِف متغيّرات S3_* في .env' }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const fileName = String(body.fileName ?? '').trim().slice(0, 255);
  const size = Number(body.size);

  if (!fileName) return NextResponse.json({ error: 'اسم الملف مطلوب.' }, { status: 400 });
  if (!Number.isInteger(size) || size <= 0) {
    return NextResponse.json({ error: 'حجم الملف غير صالح.' }, { status: 400 });
  }
  if (size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: 'الحد الأقصى لحجم الملف 25 ميغابايت.' }, { status: 400 });
  }
  const contentType = resolveDocumentType(fileName, String(body.contentType ?? ''));
  if (!contentType) {
    return NextResponse.json({ error: 'نوع الملف غير مسموح. المسموح: PDF، صور، مستندات Office، نصوص، صوت وفيديو MP4/MP3.' }, { status: 415 });
  }

  // اسم آمن + معرّف فريد، تحت بادئة المؤسسة
  const key = `${orgObjectPrefix(actor.organization.id)}${randomUUID()}-${safeStorageName(fileName)}`;

  try {
    const uploadUrl = await presignUpload(key, contentType, size);
    return NextResponse.json({ ok: true, key, uploadUrl, contentType });
  } catch {
    return NextResponse.json({ error: 'تعذّر تجهيز الرفع.' }, { status: 502 });
  }
}
