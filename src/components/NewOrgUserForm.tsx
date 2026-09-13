'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ASSIGNABLE_ROLES } from '@/lib/permissions';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function NewOrgUserForm({ slug }: { slug: string }) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('MEMBER');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/org/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'تعذّر الإنشاء.');
        setBusy(false);
        return;
      }
      router.push(`/org/${slug}/users`);
      router.refresh();
    } catch {
      setError('تعذّر الاتصال بالخادم.');
      setBusy(false);
    }
  }

  return (
    <form className="org-form" onSubmit={handleSubmit}>
      {error && <div className="org-alert">{error}</div>}

      <div className="org-field">
        <label htmlFor="name">الاسم الكامل</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="org-field">
        <label htmlFor="email">البريد الإلكتروني</label>
        <input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="org-field">
        <label htmlFor="password">كلمة المرور المؤقتة <span className="org-hint">8 محارف على الأقل</span></label>
        <input id="password" type="text" dir="ltr" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>

      <div className="org-field">
        <label htmlFor="role">الدور</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          {ASSIGNABLE_ROLES.map((r) => (
            <option key={r} value={r}>{t(`role.${r}`)}</option>
          ))}
        </select>
      </div>

      <div className="org-form-actions">
        <Link href={`/org/${slug}/users`} className="org-btn org-btn-outline">إلغاء</Link>
        <button type="submit" className="org-btn org-btn-primary" disabled={busy}>
          {busy ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
        </button>
      </div>
    </form>
  );
}
