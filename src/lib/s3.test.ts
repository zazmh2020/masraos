import { beforeAll, describe, expect, it } from 'vitest';

// بيانات اعتماد وهمية: توقيع الروابط حساب محلي لا يتصل بأي مزوّد.
beforeAll(() => {
  process.env.S3_BUCKET = 'test-bucket';
  process.env.S3_REGION = 'us-east-1';
  process.env.S3_ACCESS_KEY_ID = 'AKIATESTONLYNOTREAL';
  process.env.S3_SECRET_ACCESS_KEY = 'test-only-not-a-real-secret';
});

describe('S3 presigned URLs', () => {
  it('binds the upload URL to both content type and content length', async () => {
    const { presignUpload } = await import('./s3');
    const url = new URL(await presignUpload('documents/org_a/x.pdf', 'application/pdf', 1234));
    const signed = (url.searchParams.get('X-Amz-SignedHeaders') ?? '').split(';');
    expect(signed).toContain('content-type');
    expect(signed).toContain('content-length');
    expect(Number(url.searchParams.get('X-Amz-Expires'))).toBeLessThanOrEqual(300);
  });

  it('always downloads as an attachment, with an RFC 5987 name for Arabic filenames', async () => {
    const { attachmentDisposition, presignDownload } = await import('./s3');
    const value = attachmentDisposition('سجل "الحفظ"\r\n.pdf');
    expect(value).toMatch(/^attachment; filename="[\x20-\x7e]+"; filename\*=UTF-8''/);
    expect(value).not.toMatch(/[\r\n]/);
    const url = new URL(await presignDownload('documents/org_a/x.pdf', 'تقرير.pdf'));
    expect(url.searchParams.get('response-content-disposition')).toContain('attachment;');
  });
});
