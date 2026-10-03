'use client';
/* eslint-disable @next/next/no-img-element -- Private portraits must use the authenticated same-origin endpoint, never the shared image optimizer. */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { registrationFields } from '@/lib/student-registration';
import styles from './registration.module.css';

type Props = { id: string; initial: Record<string, string>; consent: boolean; hasPhoto: boolean; storageReady: boolean;
  org: { name: string; logoUrl: string | null }; serial: number | null; halaqa: string; teacher: string;
  status: string; updatedAt: string; updatedBy: string };
const basicFields = [['name', 'اسم الطالب'], ['birthDate', 'تاريخ الميلاد'], ['phone', 'هاتف الطالب'],
  ['guardianName', 'اسم ولي الأمر'], ['guardianPhone', 'هاتف ولي الأمر'], ['guardianEmail', 'بريد ولي الأمر'], ['enrolledAt', 'تاريخ الالتحاق']] as const;
const groups = [
  { title: 'المستوى التعليمي', keys: ['memorizationLevel'] },
  { title: 'ولي الأمر والطوارئ', keys: ['guardianRelation', 'alternatePhone', 'emergencyName', 'emergencyRelation', 'emergencyPhone', 'authorizedPickup'] },
  { title: 'السكن (اختياري)', keys: ['city', 'district', 'address', 'homeLocationUrl'] },
  { title: 'الرعاية والملاحظات الإدارية', keys: ['healthNotes', 'adminNotes'] },
];

export default function StudentRegistrationForm(p: Props) {
  const router = useRouter();
  const [values, setValues] = useState(p.initial);
  const [consent, setConsent] = useState(p.consent);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<'administrative' | 'educational'>('educational');
  const [preview, setPreview] = useState(false);
  const article = useRef<HTMLElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(p.initial) || consent !== p.consent;
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/org/education/students/${p.id}/registration`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, consentConfirmed: consent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'تعذر الحفظ.');
      setMessage('تم الحفظ.'); router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر الاتصال. لم تُفقد مدخلاتك.'); }
    finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage('الحد الأقصى للصورة 2 ميجابايت.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/org/education/students/${p.id}/photo`, { method: 'POST', body: file });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'تعذر رفع الصورة.');
      router.refresh(); setMessage('تم حفظ الصورة.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر رفع الصورة.'); }
    finally { setBusy(false); }
  }
  async function print() {
    if (dirty) { setMessage('احفظ التعديلات أولًا قبل الطباعة.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/org/education/students/${p.id}/registration/export`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }),
      });
      if (!response.ok) throw new Error('تعذر توثيق طلب الطباعة. حاول مجددًا.');
      await document.fonts.ready;
      await Promise.all(Array.from(article.current?.querySelectorAll('img') ?? []).map(img => img.decode().catch(() => undefined)));
      window.print();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذرت الطباعة.'); }
    finally { setBusy(false); }
  }
  async function detachPhoto() {
    if (!confirm('إزالة الصورة من الاستمارة؟ لن تُحذف النسخة المخزنة نهائيًا.')) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/org/education/students/${p.id}/photo`, { method: 'DELETE' });
      if (!response.ok) throw new Error('تعذرت إزالة الصورة من الاستمارة.');
      router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'تعذر الاتصال.'); }
    finally { setBusy(false); }
  }
  const field = (key: string, label: string, max = 150) => <div className="org-field" key={key}>
    <label htmlFor={`registration-${key}`}>{label}</label>
    {max >= 300 && key !== 'homeLocationUrl'
      ? <textarea id={`registration-${key}`} rows={3} maxLength={max} value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />
      : <input id={`registration-${key}`} required={key === 'name'} maxLength={max}
        type={key.endsWith('Date') || key === 'enrolledAt' ? 'date' : key.endsWith('Email') ? 'email' : key === 'homeLocationUrl' ? 'url' : 'text'}
        value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />}
  </div>;
  const valueRow = (label: string, value?: string | number | null) => <div className={styles.row} key={label}><strong>{label}</strong><span>{value || 'غير مسجل'}</span></div>;
  return <div className={styles.root}>
    <style media="print">{'@page { size: A4 portrait; margin: 12mm; }'}</style>
    <div className={styles.controls}>
      <p role="status" aria-live="polite">{message}</p>
      <form onSubmit={save} className="org-form">
        <fieldset disabled={busy} className={styles.fieldset}>
          <h2>البيانات الأساسية</h2><div className={styles.grid}>{basicFields.map(([key, label]) => field(key, label, key === 'guardianEmail' ? 254 : key.toLowerCase().includes('phone') ? 40 : 150))}</div>
          {groups.map(group => <section key={group.title}><h2>{group.title}</h2><div className={styles.grid}>
            {registrationFields.filter(([key]) => group.keys.includes(key)).map(([key, label, max]) => field(key, label, max))}
          </div></section>)}
          <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
            أؤكد إبلاغ ولي الأمر بغرض جمع هذه البيانات والصورة والحصول على موافقته المناسبة.</label>
          <p>معلومات السكن والصحة والصورة اختيارية، ومتاحة لمدير المركز فقط. لا تُدخل معلومات لا يحتاجها المركز.</p>
          <button className="org-btn org-btn-primary" type="submit">{busy ? 'جارٍ الحفظ…' : 'حفظ الاستمارة'}</button>
        </fieldset>
      </form>
      <section className="org-panel"><h2>الصورة الشخصية (اختيارية)</h2>
        {p.hasPhoto &&
          <img className={styles.photo} src={`/api/org/education/students/${p.id}/photo?v=${encodeURIComponent(p.updatedAt)}`} alt="صورة الطالب" />}
        <p>{p.storageReady ? 'احفظ الموافقة أولًا. JPEG أو PNG أو WebP حتى 2 ميجابايت. تُحذف بيانات الموقع المضمّنة بالصورة تلقائيًا.' : 'التخزين الخاص للصور غير مُعدّ؛ يمكنك حفظ الاستمارة وطباعتها دون صورة.'}</p>
        <label>اختيار صورة <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || dirty || !p.consent || !p.storageReady} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
        {p.hasPhoto && <button type="button" className="org-btn org-btn-outline" disabled={busy || dirty} onClick={() => void detachPhoto()}>إزالة الصورة من الاستمارة</button>}
      </section>
      <section className="org-panel"><h2>الطباعة والتصدير</h2>
        <label>نوع النسخة <select value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
          <option value="educational">تعليمية مختصرة — دون عنوان أو بيانات صحية واتصال</option>
          <option value="administrative">إدارية كاملة — سرية</option>
        </select></label>
        <p>للتصدير اختر «حفظ بصيغة PDF» من نافذة الطباعة. المعاينة تعرض البيانات المحفوظة فقط.</p>
        <button className="org-btn org-btn-outline" type="button" disabled={dirty || busy} onClick={() => setPreview(!preview)}>{preview ? 'إخفاء المعاينة' : 'معاينة الاستمارة'}</button>
        <button className="org-btn org-btn-primary" type="button" disabled={!preview || dirty || busy} onClick={() => void print()}>طباعة / حفظ PDF</button>
      </section>
    </div>
    {preview && <article ref={article} className={`${styles.sheet} masra-registration-print`} dir="rtl">
      <header className={styles.header}>
        {p.org.logoUrl && <img className={styles.logo} src={p.org.logoUrl} alt="شعار المركز" />}
        <div><h2>{p.org.name}</h2><h1>استمارة الطالب</h1><p>{mode === 'administrative' ? 'نسخة إدارية سرية' : 'نسخة تعليمية مختصرة'}</p></div>
        {p.hasPhoto && mode === 'administrative' && <img className={styles.photo} src={`/api/org/education/students/${p.id}/photo?v=${encodeURIComponent(p.updatedAt)}`} alt="صورة الطالب" />}
      </header>
      <h3>البيانات الأساسية والتعليمية</h3><div className={styles.grid}>
        {valueRow('اسم الطالب', p.initial.name)}{valueRow('الرقم الداخلي', p.serial)}
        {valueRow('الحلقة', p.halaqa)}{valueRow('المعلم', p.teacher)}
        {valueRow('الحالة', ({ ACTIVE: 'منتظم', PAUSED: 'متوقف', GRADUATED: 'متخرج', WITHDRAWN: 'منسحب' } as Record<string, string>)[p.status])}
        {valueRow('تاريخ الالتحاق', p.initial.enrolledAt)}{valueRow('مستوى الحفظ والمراجعة', p.initial.memorizationLevel)}
      </div>
      {mode === 'administrative' && <>
        <h3>التواصل</h3><div className={styles.grid}>{basicFields.filter(([key]) => !['name', 'enrolledAt'].includes(key)).map(([key, label]) => valueRow(label, p.initial[key]))}</div>
        {groups.filter(g => g.title !== 'المستوى التعليمي').map(g => <section key={g.title}><h3>{g.title}</h3><div className={styles.grid}>
          {registrationFields.filter(([key]) => g.keys.includes(key)).map(([key, label]) => valueRow(label, p.initial[key]))}
        </div></section>)}
        {p.initial.homeLocationUrl && <a href={p.initial.homeLocationUrl} target="_blank" rel="noopener noreferrer">فتح موقع المنزل</a>}
        <p>تأكيد موافقة ولي الأمر مسجل: {p.consent ? 'نعم' : 'لا'}</p>
        <p>توقيع ولي الأمر: ____________________　 اعتماد الإدارة: ____________________</p>
      </>}
      <footer>آخر تحديث: {new Date(p.updatedAt).toLocaleDateString('ar-SA')} · بواسطة: {p.updatedBy}<br />
        تاريخ إصدار النسخة: {new Date().toLocaleDateString('ar-SA')} · راجع بيانات التواصل قبل الاعتماد عليها في الطوارئ.</footer>
    </article>}
  </div>;
}
