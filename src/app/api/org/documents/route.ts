import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrgActor } from '@/lib/org';
import { canManageDocuments } from '@/lib/permissions';
import { deleteObject, isS3Configured, orgObjectPrefix, readObjectHead, statObject } from '@/lib/s3';
import { MAX_DOCUMENT_BYTES, contentMatchesType, isValidDocumentKey, resolveDocumentType } from '@/lib/upload-policy';

/** يسجّل البيانات الوصفية لوثيقة رُفعت للتوّ إلى المخزن */
export async function POST(request: Request) {
  const actor = await getOrgActor();
  if (!actor || !canManageDocuments(actor)) {
    return NextResponse.json({ error: 'غير مصرّح.' }, { status: 403 });
  }
  const orgId = actor.organization.id;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim();
  const category = String(body.category ?? '').trim();
  const fileKey = String(body.key ?? '');
  const fileName = String(body.fileName ?? '').trim();
  const contentType = resolveDocumentType(fileName, String(body.contentType ?? ''));
  const size = Number(body.size);
  const departmentId = body.departmentId ? String(body.departmentId) : null;

  if (name.length < 2) return NextResponse.json({ error: 'اسم الوثيقة قصير جداً.' }, { status: 400 });
  if (!fileName) return NextResponse.json({ error: 'اسم الملف مطلوب.' }, { status: 400 });
  if (!Number.isInteger(size) || size <= 0 || size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: 'حجم الملف غير صالح.' }, { status: 400 });
  }

  // عزل: المفتاح يجب أن يكون بالشكل الذي أنشأه الخادم تحت بادئة هذه المؤسسة، وأن يكون جديدًا
  if (!isValidDocumentKey(fileKey, orgObjectPrefix(orgId))) {
    return NextResponse.json({ error: 'مفتاح الملف غير صالح.' }, { status: 400 });
  }
  if (!contentType) {
    return NextResponse.json({ error: 'نوع الملف غير مسموح.' }, { status: 415 });
  }
  const exists = await prisma.document.findUnique({ where: { fileKey }, select: { id: true } });
  if (exists) return NextResponse.json({ error: 'الملف مسجّل بالفعل.' }, { status: 409 });

  // لا نثق بما أعلنه المتصفّح: الحجم والنوع الفعليان من المخزن، ثم توقيع أول البايتات.
  if (!isS3Configured()) return NextResponse.json({ error: 'التخزين غير مُعدّ.' }, { status: 503 });
  const stored = await statObject(fileKey);
  if (!stored) return NextResponse.json({ error: 'لم يكتمل رفع الملف.' }, { status: 400 });
  let verified = stored.size === size && stored.size <= MAX_DOCUMENT_BYTES && stored.contentType.split(';')[0] === contentType;
  if (verified) {
    try { verified = contentMatchesType(contentType, await readObjectHead(fileKey)); } catch { verified = false; }
  }
  if (!verified) {
    await deleteObject(fileKey).catch(() => undefined); // لا نُبقي ملفًا لم يجتز الفحص
    return NextResponse.json({ error: 'محتوى الملف لا يطابق نوعه أو حجمه.' }, { status: 422 });
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, organizationId: orgId }, select: { id: true } });
    if (!dept) return NextResponse.json({ error: 'الوحدة غير موجودة.' }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: {
      name,
      description: description || null,
      category: category || null,
      fileKey,
      fileName,
      contentType,
      size,
      departmentId,
      uploadedById: actor.id,
      organizationId: orgId, // عزل
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: doc.id });
}
