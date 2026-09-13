'use client';

import { useState, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';
import { tenantHost, tenantUrl } from '@/lib/app-domain';
import { SECTORS } from '@/lib/org-types';
import { ORG_MODULES, MODULE_REGISTRY } from '@/lib/modules';

export default function NewOrgForm() {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ slug: string; adminEmail: string } | null>(null);

  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  // اختيار القطاع (يُشتقّ منه نوع المؤسسة والأنظمة المُهيَّأة)
  const [sectorId, setSectorId] = useState('QURAN_CENTER');
  const sector = useMemo(() => SECTORS.find((s) => s.id === sectorId) ?? SECTORS[0], [sectorId]);
  const type = sector.type ?? 'ASSOCIATION';
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
      // الأنظمة المعطّلة = كل نظام قابل للتفعيل ليس ضمن الأنظمة المُهيَّأة للقطاع
      const disabledModules = ORG_MODULES.filter((m) => !sector.suggestedModules.includes(m));
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug,
          type,
          disabledModules,
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
          <label>{t('aorg.form.sector')}<span className="field-hint">{t('aorg.form.sectorHint')}</span></label>
          <div className="sector-grid">
            {SECTORS.map((s) => {
              const selectable = s.type !== null;
              const selected = s.id === sectorId;
              return (
                <button
                  type="button"
                  key={s.id}
                  className={`sector-card ${selected ? 'is-selected' : ''} ${selectable ? '' : 'is-disabled'}`}
                  onClick={() => selectable && setSectorId(s.id)}
                  disabled={!selectable}
                  aria-pressed={selected}
                >
                  <span className="sector-ic"><Icon name={s.icon} size={20} /></span>
                  <span className="sector-tx">
                    <span className="sector-name">{t(s.labelKey)}</span>
                    <span className="sector-desc">{t(s.descKey)}</span>
                  </span>
                  <span className={`sector-badge st-${s.status}`}>{t(`sector.status.${s.status}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="admin-field">
          <span className="field-hint">{t('aorg.form.suggestedModules')}</span>
          <div className="sector-mods">
            {sector.suggestedModules.map((m) => (
              <span key={m} className="sector-mod-chip">
                <Icon name={MODULE_REGISTRY[m].icon} size={14} /> {t(MODULE_REGISTRY[m].labelKey)}
              </span>
            ))}
          </div>
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
