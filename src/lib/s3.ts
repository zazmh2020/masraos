import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
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

/** رابط رفع موقّع (PUT) — يرفع المتصفّح الملف مباشرةً إلى المزوّد */
export function presignUpload(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: EXPIRES },
  );
}

/** رابط تنزيل موقّع (GET) — مع اسم ملف واضح عند الحفظ */
export function presignDownload(key: string, fileName: string): Promise<string> {
  const safe = fileName.replace(/["\\\r\n]/g, '_');
  return getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safe}"`,
    }),
    { expiresIn: EXPIRES },
  );
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
