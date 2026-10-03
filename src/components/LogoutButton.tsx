'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';
import Icon from '@/components/Icon';

/**
 * زر تسجيل خروج ظاهر مع نافذة تأكيد — يعمل لأي مستخدم.
 * يعتمد أنماط org-modal / org-btn (تأكّد من تحميل org.css في الصفحة).
 */
export default function LogoutButton({ redirectTo = '/login' }: { redirectTo?: string }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doLogout() {
    setBusy(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = redirectTo;
  }

  return (
    <>
      <div className="org-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <strong style={{ color: 'var(--purple-900)', fontFamily: 'var(--font-display)' }}>{t('shell.logout')}</strong>
          <p className="org-panel-sub" style={{ margin: '0.25rem 0 0' }}>{t('logout.sub')}</p>
        </div>
        <button type="button" className="org-btn org-btn-danger" onClick={() => setConfirm(true)}>
          {t('shell.logout')}
        </button>
      </div>

      {confirm && (
        <div className="org-modal-scrim" onClick={() => setConfirm(false)}>
          <div className="org-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="org-modal-ic">
              <Icon name="logout" size={24} />
            </div>
            <h3>{t('shell.logout.confirm.title')}</h3>
            <p>{t('shell.logout.confirm.body')}</p>
            <div className="org-modal-actions">
              <button className="org-btn org-btn-outline" onClick={() => setConfirm(false)} disabled={busy}>{t('shell.cancel')}</button>
              <button className="org-btn org-btn-danger" onClick={doLogout} disabled={busy}>
                {busy ? t('shell.loggingOut') : t('shell.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
