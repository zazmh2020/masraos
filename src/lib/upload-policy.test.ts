import { describe, expect, it } from 'vitest';
import { contentMatchesType, isValidDocumentKey, resolveDocumentType, safeStorageName } from './upload-policy';

const bytes = (...v: number[]) => new Uint8Array(v);
const text = (s: string) => new TextEncoder().encode(s);
const PREFIX = 'documents/org_a/';
const UUID = '0f8fad5b-d9cb-469f-a165-70867728950e';

describe('document upload policy', () => {
  it('accepts allowed types by extension, even when the browser sends no type', () => {
    expect(resolveDocumentType('تقرير.pdf', 'application/pdf')).toBe('application/pdf');
    expect(resolveDocumentType('scan.JPG', '')).toBe('image/jpeg');
    expect(resolveDocumentType('list.csv', 'application/vnd.ms-excel')).toBe('text/csv');
  });

  it('rejects executable or script-capable types and extension/type mismatches', () => {
    expect(resolveDocumentType('page.html', 'text/html')).toBeNull();
    expect(resolveDocumentType('logo.svg', 'image/svg+xml')).toBeNull();
    expect(resolveDocumentType('setup.exe', 'application/octet-stream')).toBeNull();
    expect(resolveDocumentType('noext', 'application/pdf')).toBeNull();
    expect(resolveDocumentType('report.pdf', 'text/html')).toBeNull(); // يعلن HTML بامتداد PDF
  });

  it('checks the real file signature, not the declared type', () => {
    expect(contentMatchesType('application/pdf', text('%PDF-1.7 ...'))).toBe(true);
    expect(contentMatchesType('application/pdf', text('<html><script>alert(1)</script>'))).toBe(false);
    expect(contentMatchesType('image/png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(true);
    expect(contentMatchesType('image/jpeg', bytes(0x89, 0x50, 0x4e, 0x47))).toBe(false);
    expect(contentMatchesType('application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes(0x50, 0x4b, 0x03, 0x04))).toBe(true);
    expect(contentMatchesType('image/webp', text('RIFF\0\0\0\0WEBPVP8 '))).toBe(true);
  });

  it('rejects text files that are really HTML/SVG or binary', () => {
    expect(contentMatchesType('text/plain', text('ملاحظات الحلقة'))).toBe(true);
    expect(contentMatchesType('text/plain', text('  <!DOCTYPE html><html>'))).toBe(false);
    expect(contentMatchesType('text/csv', text('<svg onload=alert(1)>'))).toBe(false);
    expect(contentMatchesType('text/plain', bytes(0x61, 0x00, 0x62))).toBe(false);
    expect(contentMatchesType('text/plain', new Uint8Array())).toBe(false);
  });

  it('produces storage names without path separators or traversal', () => {
    expect(safeStorageName('../../etc/passwd')).not.toMatch(/\/|\.\./);
    expect(safeStorageName('a\\b/c.pdf')).toBe('a_b_c.pdf');
    expect(safeStorageName('سجل الحفظ.pdf')).toBe('سجل_الحفظ.pdf');
    expect(safeStorageName('')).toBe('file');
  });

  it('accepts only server-shaped keys under the caller organization', () => {
    expect(isValidDocumentKey(`${PREFIX}${UUID}-report.pdf`, PREFIX)).toBe(true);
    expect(isValidDocumentKey(`documents/org_b/${UUID}-report.pdf`, PREFIX)).toBe(false); // مؤسسة أخرى
    expect(isValidDocumentKey(`${PREFIX}../org_b/${UUID}-x.pdf`, PREFIX)).toBe(false); // عبور مسار
    expect(isValidDocumentKey(`${PREFIX}${UUID}-a/b.pdf`, PREFIX)).toBe(false);
    expect(isValidDocumentKey(`${PREFIX}not-a-uuid-report.pdf`, PREFIX)).toBe(false);
    expect(isValidDocumentKey(`${PREFIX}${UUID}-..pdf`, PREFIX)).toBe(false);
  });
});
