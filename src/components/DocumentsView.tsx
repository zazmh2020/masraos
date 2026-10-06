'use client';

import { IconShape } from '@/components/Icon';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/LocaleProvider';

type Doc = {
  id: string; name: string; description: string | null; category: string | null;
  fileName: string; contentType: string; size: number;
  departmentId: string | null; uploadedBy: string | null; createdAt: string;
};
type Ref = { id: string; name: string };

export default function DocumentsView({
  documents, departments, storageReady, canManage,
}: { documents: Doc[]; departments: Ref[]; storageReady: boolean; canManage: boolean }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
  const humanSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} ${t('doc.byteB')}`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} ${t('doc.byteKB')}`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${t('doc.byteMB')}`;
  };
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const deptName = (id: string | null) => (id ? departments.find((d) => d.id === id)?.name ?? null : null);
  const categories = useMemo(
    () => Array.from(new Set(documents.map((d) => d.category).filter(Boolean))) as string[],
    [documents],
  );
  const shown = useMemo(
    () => (filter === 'ALL' ? documents : documents.filter((d) => d.category === filter)),
    [documents, filter],
  );

  function pickFile(f: File | null) {
    setFile(f);
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''));
  }

  function reset() {
    setFile(null); setName(''); setDescription(''); setCategory(''); setDepartmentId('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!file) { setError(t('doc.selectFile')); return; }
    setUploading(true);
    try {
      // 1) رابط رفع موقّع
      setProgress(t('doc.preparing'));
      const pres = await fetch('/api/org/documents/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
      });
      const pdata = await pres.json().catch(() => ({}));
      if (!pres.ok) { setError(pdata.error ?? t('doc.prepErr')); return; }

      // 2) رفع الملف مباشرةً إلى المخزن
      setProgress(t('doc.uploadingP'));
      const put = await fetch(pdata.uploadUrl, {
        method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file,
      });
      if (!put.ok) { setError(t('doc.uploadFail')); return; }

      // 3) تسجيل البيانات الوصفية
      setProgress(t('doc.savingP'));
      const save = await fetch('/api/org/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, description, category, key: pdata.key,
          fileName: file.name, contentType: file.type || 'application/octet-stream', size: file.size,
          departmentId: departmentId || null,
        }),
      });
      const sdata = await save.json().catch(() => ({}));
      if (!save.ok) { setError(sdata.error ?? t('form.saveErr')); return; }

      reset();
      router.refresh();
    } catch {
      setError(t('form.netErr'));
    } finally {
      setUploading(false);
      setProgress('');
    }
  }

  async function remove(id: string) {
    if (!confirm(t('doc.deleteConfirm'))) return;
    setError(''); setBusyId(id);
    try {
      const res = await fetch(`/api/org/documents/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t('form.deleteErr'));
      else router.refresh();
    } catch { setError(t('form.netErr')); }
    finally { setBusyId(null); }
  }

  return (
    <>
      {!storageReady && (
        <div className="org-alert">
          {t('doc.storageNotReady')} <code dir="ltr">S3_*</code> · <code dir="ltr">.env</code>
        </div>
      )}

      <div className="org-toolbar">
        {categories.length > 0 && (
          <select className="org-inline-select" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('doc.filterByCat')}>
            <option value="ALL">{t('doc.allCats')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <span className="org-toolbar-spacer" />
      </div>

      {canManage && storageReady && (
        <form className="org-form" onSubmit={handleUpload}>
          <div className="org-field">
            <label htmlFor="doc-file">{t('doc.file')} <span className="org-hint">{t('doc.maxSize')}</span></label>
            <input id="doc-file" ref={fileRef} type="file" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} required />
          </div>
          <div className="org-field-row">
            <div className="org-field">
              <label htmlFor="doc-name">{t('doc.name')}</label>
              <input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="org-field">
              <label htmlFor="doc-cat">{t('doc.category')} <span className="org-hint">{t('view.optional')}</span></label>
              <input id="doc-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('doc.catPh')} />
            </div>
            <div className="org-field">
              <label htmlFor="doc-dept">{t('view.unitShort')}</label>
              <select id="doc-dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">{t('view.noUnit')}</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="org-field">
            <label htmlFor="doc-desc">{t('doc.desc')} <span className="org-hint">{t('view.optional')}</span></label>
            <input id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="org-form-actions">
            {progress && <span className="org-hint">{progress}</span>}
            <button type="submit" className="org-btn org-btn-primary" disabled={uploading}>
              {uploading ? t('doc.uploadingShort') : t('doc.upload')}
            </button>
          </div>
        </form>
      )}

      {error && <div className="org-alert">{error}</div>}

      {shown.length === 0 ? (
        <div className="org-empty"><IconShape name="documents" variant="soft" size="xl" /><p>{documents.length === 0 ? t('doc.none') : t('doc.noneInCat')}</p></div>
      ) : (
        <div className="org-table-wrap">
          <table className="org-table">
            <thead>
              <tr>
                <th>{t('doc.th.doc')}</th>
                <th>{t('doc.th.category')}</th>
                <th>{t('doc.th.unit')}</th>
                <th>{t('doc.th.size')}</th>
                <th>{t('doc.th.date')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.name}</strong>
                    <small dir="ltr">{d.fileName}</small>
                    {d.description && <small>{d.description}</small>}
                  </td>
                  <td>{d.category ?? '—'}</td>
                  <td>{deptName(d.departmentId) ?? '—'}</td>
                  <td dir="ltr">{humanSize(d.size)}</td>
                  <td>{dateFmt.format(new Date(d.createdAt))}</td>
                  <td className="org-row-actions">
                    <a className="org-btn org-btn-quiet" href={`/api/org/documents/${d.id}/download`}>{t('doc.download')}</a>
                    {canManage && (
                      <button className="org-btn org-btn-danger" disabled={busyId === d.id} onClick={() => remove(d.id)}>{t('view.delete')}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
