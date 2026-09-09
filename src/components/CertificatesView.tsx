'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import { useLocale } from '@/lib/i18n/LocaleProvider';

interface Student { id: string; name: string; halaqa: string | null; sessions: number; }

export default function CertificatesView({ students, orgName, orgLogo = null }: { students: Student[]; orgName: string; orgLogo?: string | null }) {
  const { t, locale } = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'ar-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
  const [active, setActive] = useState<string>(students[0]?.id ?? '');
  const cur = students.find((s) => s.id === active);
  const today = dateFmt.format(new Date());

  if (students.length === 0) {
    return <div className="mod-detail"><p style={{ color: 'var(--gray-500)' }}>{t('cert.empty')}</p></div>;
  }

  return (
    <div className="hub">
      <div className="hub-list">
        {students.map((s) => (
          <button key={s.id} className={`hub-item ${active === s.id ? 'is-active' : ''}`} onClick={() => setActive(s.id)}>
            <span className="hub-item-ic"><Icon name="people/people-students" size={18} /></span>
            <span className="hub-item-tx"><span className="t">{s.name}</span><span className="s">{s.halaqa ?? t('cert.noHalaqa')}</span></span>
            <span className={`hub-tag ${s.sessions > 0 ? 'ok' : 'muted'}`}>{s.sessions > 0 ? t('cert.qualified') : t('cert.beginner')}</span>
          </button>
        ))}
      </div>

      <div className="hub-panel">
        <AnimatePresence mode="wait">
          {cur && (
            <motion.div key={cur.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
              <div className="cert-preview">
                <div className="cert-frame">
                  <div className="cert-logo">
                    {orgLogo
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img className="cert-logo-img" src={orgLogo} alt="" />
                      : <LogoMark size={34} />}
                  </div>
                  <div className="cert-title">{t('cert.title')}</div>
                  <p className="cert-sub">{orgName}</p>
                  <div className="cert-name">{cur.name}</div>
                  <p className="cert-body">
                    {t('cert.body', { org: orgName, unit: cur.halaqa ?? t('cert.hisHalaqat') })}
                  </p>
                  <div className="cert-seal">{t('cert.sealBrand')}<br />{t('cert.sealLabel')}</div>
                  <p className="cert-sub" style={{ marginTop: '1rem' }}>{t('cert.issuedOn', { d: today })}</p>
                </div>
              </div>
              <div className="cert-actions">
                <button className="org-btn org-btn-primary" onClick={() => window.print()}>
                  {t('cert.print')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
