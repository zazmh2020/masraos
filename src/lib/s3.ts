import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/* ============================================================
   تخزين متوافق مع S3 (AWS S3 / Cloudflare R2 / MinIO / …)
   يُضبط بالكامل من متغيرات البيئة، ويستخدم روابط موقّعة مؤقتة
   ليرفع المتصفّح ويُنزّل من المزوّد مباشرةً دون المرور بالخادم.
   ============================================================ */

const BUCKET = process.env.S3_BUCKET ?? '';

/** هل إعداد التخزين مكتمل؟ نتحقق قبل أي عملية. */
export function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}

let client: S3Client | null = null;

function s3(): S3Client {
  if (!isS3Configured()) {
    throw new Error('التخزين (S3) غير مُعدّ. أضِف متغيّرات S3_* في ملف .env');
  }
  if (client) return client;
  client = new S3Client({
    region: process.env.S3_REGION ?? 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined, // مطلوب لـ R2/MinIO، اتركه فارغًا لـ AWS
    // نمط المسار مطلوب لـ MinIO وبعض المزوّدات
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

const EXPIRES = 300; // صلاحية الرابط الموقّع: 5 دقائق

/**
 * رابط رفع موقّع (PUT) — يرفع المتصفّح الملف مباشرةً إلى المزوّد.
 * النوع والحجم ضمن التوقيع: يرفض المخزن أي رفع بنوع أو حجم مختلف عمّا أُذن به.
 */
export function presignUpload(key: string, contentType: string, size: number): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType, ContentLength: size }),
    { expiresIn: EXPIRES, signableHeaders: new Set(['content-type', 'content-length']) },
  );
}

/** ترويسة تنزيل آمنة: اسم ASCII احتياطي + الاسم الأصلي بترميز RFC 5987 (للأسماء العربية). */
export function attachmentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'file';
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName.replace(/[\r\n]/g, ''))}`;
}

/** رابط تنزيل موقّع (GET) — دائمًا كمرفق، فلا يُعرض أي محتوى داخل المتصفّح من نطاق المخزن */
export function presignDownload(key: string, fileName: string): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: attachmentDisposition(fileName),
    }),
    { expiresIn: EXPIRES },
  );
}

/** الحجم والنوع الفعليان لكائن مرفوع (أو null إن لم يوجد). */
export async function statObject(key: string): Promise<{ size: number; contentType: string } | null> {
  try {
    const head = await s3().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return { size: Number(head.ContentLength ?? -1), contentType: String(head.ContentType ?? '') };
  } catch {
    return null;
  }
}

/** أول بايتات الكائن فقط (طلب Range) — لفحص توقيع الملف دون تحميله كاملًا في الذاكرة. */
export async function readObjectHead(key: string, bytes = 64): Promise<Uint8Array> {
  const object = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: `bytes=0-${bytes - 1}` }));
  return (await object.Body?.transformToByteArray()) ?? new Uint8Array();
}

/** حذف كائن من المخزن */
export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** مفتاح كائن معزول بالمؤسسة — يمنع الوصول العابر بين المستأجرين */
export function orgObjectPrefix(orgId: string): string {
  return `documents/${orgId}/`;
}

/** Student portraits are private objects, served only after an admin/tenant check. */
export async function putStudentPhoto(key: string, bytes: Uint8Array): Promise<void> {
  await s3().send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: bytes,
    ContentType: 'image/jpeg', CacheControl: 'private, no-store' }));
}

export async function readStudentPhoto(key: string): Promise<Uint8Array | undefined> {
  const object = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return object.Body?.transformToByteArray();
}
