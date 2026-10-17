/* ============================================================
   سياسة رفع الوثائق — الأنواع المسموحة، الحجم، المفاتيح، وفحص محتوى الملف.

   المتصفّح يرفع مباشرة إلى المخزن، لذلك لا يُوثَق بما يعلنه:
   1) قبل الرفع: النوع من القائمة المسموحة ومطابق للامتداد، والحجم ضمن الحد،
      ويُوقَّع رابط الرفع على النوع والحجم معًا فلا يقبل المخزن غيرهما.
   2) بعد الرفع وقبل التسجيل: يُقرأ الحجم الفعلي وأول بايتات الملف من المخزن
      ويُرفض (ويُحذف) أي ملف لا يطابق توقيع نوعه.
   ============================================================ */

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024; // 25 ميغابايت

type Sniff = (b: Uint8Array) => boolean;

const startsWith = (sig: number[], offset = 0): Sniff => (b) =>
  b.length >= offset + sig.length && sig.every((v, i) => b[offset + i] === v);
const ascii = (s: string, offset = 0) => startsWith([...s].map((c) => c.charCodeAt(0)), offset);
const ZIP = startsWith([0x50, 0x4b, 0x03, 0x04]); // حاويات Office الحديثة
const OLE = startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // Office القديم
/** نص عادي: لا بايت صفري، ولا يبدأ كوثيقة HTML/SVG قابلة للتنفيذ في المتصفّح. */
const plainText: Sniff = (b) => {
  if (b.includes(0)) return false;
  const head = new TextDecoder('utf-8', { fatal: false }).decode(b).replace(/^﻿/, '').trimStart().toLowerCase();
  return !/^<(!doctype|html|svg|script|\?xml)/.test(head);
};

const TYPES: Record<string, { exts: string[]; sniff: Sniff }> = {
  'application/pdf': { exts: ['pdf'], sniff: ascii('%PDF-') },
  'image/png': { exts: ['png'], sniff: startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  'image/jpeg': { exts: ['jpg', 'jpeg'], sniff: startsWith([0xff, 0xd8, 0xff]) },
  'image/webp': { exts: ['webp'], sniff: (b) => ascii('RIFF')(b) && ascii('WEBP', 8)(b) },
  'image/gif': { exts: ['gif'], sniff: ascii('GIF8') },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { exts: ['docx'], sniff: ZIP },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { exts: ['xlsx'], sniff: ZIP },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { exts: ['pptx'], sniff: ZIP },
  'application/msword': { exts: ['doc'], sniff: OLE },
  'application/vnd.ms-excel': { exts: ['xls'], sniff: OLE },
  'application/vnd.ms-powerpoint': { exts: ['ppt'], sniff: OLE },
  'text/plain': { exts: ['txt'], sniff: plainText },
  'text/csv': { exts: ['csv'], sniff: plainText },
  'audio/mpeg': { exts: ['mp3'], sniff: (b) => ascii('ID3')(b) || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) },
  'audio/mp4': { exts: ['m4a'], sniff: ascii('ftyp', 4) },
  'video/mp4': { exts: ['mp4'], sniff: ascii('ftyp', 4) },
};

/** للاستخدام في خاصية accept لحقل اختيار الملف. */
export const DOCUMENT_ACCEPT = Object.values(TYPES).flatMap((t) => t.exts.map((e) => `.${e}`)).join(',');

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

/**
 * يحدد النوع المعتمد للملف من امتداده (المتصفّح قد يرسل نوعًا فارغًا أو مختلفًا).
 * يعيد null إن لم يكن الامتداد مسموحًا أو ناقض النوعَ المعلن.
 */
export function resolveDocumentType(fileName: string, declared: string): string | null {
  const ext = extensionOf(fileName);
  const byExt = Object.entries(TYPES).find(([, t]) => t.exts.includes(ext))?.[0];
  if (!byExt) return null;
  const d = declared.split(';')[0].trim().toLowerCase();
  if (d && d !== 'application/octet-stream' && d !== byExt) {
    // بعض الأنظمة تعلن CSV كـ application/vnd.ms-excel — نقبل الامتداد إن كان النوع المعلن من نفس العائلة النصية
    if (!(byExt === 'text/csv' && (d === 'application/vnd.ms-excel' || d === 'text/plain'))) return null;
  }
  return byExt;
}

/** هل أول بايتات الملف تطابق توقيع نوعه المعتمد؟ */
export function contentMatchesType(contentType: string, head: Uint8Array): boolean {
  const t = TYPES[contentType];
  return Boolean(t && head.length > 0 && t.sniff(head));
}

/** اسم ملف آمن للتخزين: حروف وأرقام ونقطة وشرطة فقط، بطول محدود ويحافظ على الامتداد. */
export function safeStorageName(fileName: string): string {
  const cleaned = fileName.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/\.{2,}/g, '.').replace(/^[._]+/, '');
  return (cleaned || 'file').slice(-120);
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** مفتاح الوثيقة يجب أن يكون بالضبط بالشكل الذي ينشئه الخادم تحت بادئة المؤسسة — لا "/" ولا "..". */
export function isValidDocumentKey(key: string, orgPrefix: string): boolean {
  if (!key.startsWith(orgPrefix)) return false;
  const rest = key.slice(orgPrefix.length);
  return new RegExp(`^${UUID}-[\\p{L}\\p{N}._-]{1,120}$`, 'u').test(rest) && !rest.includes('..');
}
