'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useT } from '@/lib/i18n/LocaleProvider';
import { tenantHost, tenantUrl } from '@/lib/app-domain';

const orgTypes = [
  { value: 'ASSOCIATION' },
  { value: 'MOSQUE' },
  { value: 'SCHOOL' },
  { value: 'PROJECT' },
];

export default function NewOrgForm() {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ slug: string; adminEmail: string } | null>(null);

  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('ASSOCIATION');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // اقتراح slug تلقائي من اسم المؤسسة
  function handleOrgNameChange(value: string) {
    setOrgName(value);
    if (!slug || slug === autoSlug(orgName)) {
      setSlug(autoSlug(value));
    }
  }

  function autoSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug,
          type,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t('aorg.form.createErr'));
        setBusy(false);
        return;
      }

      setResult({ slug: data.slug, adminEmail });
      setBusy(false);
    } catch {
      setError(t('aorg.form.netErr'));
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="success-panel">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2>{t('aorg.success.title')}</h2>
        <p>{t('aorg.success.sub')}</p>

        <div className="success-details">
          <div className="detail-row">
            <span className="detail-label">{t('aorg.success.orgLink')}</span>
            <code dir="ltr">{tenantUrl(result.slug)}</code>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('aorg.success.loginPage')}</span>
            <code dir="ltr">{tenantUrl(result.slug, '/login')}</code>
          </div>
          <div className="detail-row">
            <span className="detail-label">{t('aorg.success.adminEmail')}</span>
            <code dir="ltr">{result.adminEmail}</code>
          </div>
        </div>

        <div className="success-actions">
          <Link href="/admin/organizations" className="btn-admin-primary">
            {t('aorg.success.backToList')}
          </Link>
          <button
            className="btn-admin-outline"
            onClick={() => {
              setResult(null);
              setOrgName(''); setSlug(''); setAdminName(''); setAdminEmail(''); setAdminPassword('');
            }}
          >
            {t('aorg.success.createAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {error && <div className="form-error"><span>⚠</span><span>{error}</span></div>}

      <fieldset>
        <legend>{t('aorg.form.orgInfo')}</legend>

        <div className="admin-field">
          <label htmlFor="orgName">{t('aorg.form.orgName')}</label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => handleOrgNameChange(e.target.value)}
            placeholder={t('aorg.form.orgNamePh')}
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="slug">
            {t('aorg.form.slug')}
            <span className="field-hint">{t('aorg.form.slugHint')}</span>
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            dir="ltr"
            placeholder="alqoran"
            pattern="[a-z0-9-]+"
            required
          />
          {slug && (
            <div className="field-preview">
              {t('aorg.form.slugPreview')} <code dir="ltr">{tenantHost(slug)}</code>
            </div>
          )}
        </div>

        <div className="admin-field">
          <label htmlFor="type">{t('aorg.form.orgType')}</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            {orgTypes.map((o) => (
              <option key={o.value} value={o.value}>{t('atype.' + o.value)}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t('aorg.form.adminAccount')}</legend>

        <div className="admin-field">
          <label htmlFor="adminName">{t('aorg.form.fullName')}</label>
          <input
            id="adminName"
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="adminEmail">{t('aorg.form.email')}</label>
          <input
            id="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            dir="ltr"
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="adminPassword">
            {t('aorg.form.tempPassword')}
            <span className="field-hint">{t('aorg.form.tempPasswordHint')}</span>
          </label>
          <input
            id="adminPassword"
            type="text"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            dir="ltr"
            minLength={8}
            required
          />
        </div>
      </fieldset>

      <div className="admin-form-actions">
        <Link href="/admin/organizations" className="btn-admin-outline">{t('shell.cancel')}</Link>
        <button type="submit" className="btn-admin-primary" disabled={busy}>
          {busy ? t('aorg.form.creating') : t('aorg.form.submit')}
        </button>
      </div>
    </form>
  );
}
