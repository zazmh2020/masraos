'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';
import '@/styles/status-page.css';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    // إبلاغ الخادم بالخطأ (مراقبة)
    fetch('/api/observe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest, where: 'app/error' }),
    }).catch(() => {});
  }, [error]);

  return (
    <main id="main" className="sp-page">
      <div className="sp-box" role="alert">
        <span className="sp-icon" aria-hidden="true"><Icon name="alert" size={30} /></span>
        <h1>{t('status.err.title')}</h1>
        <p>{t('status.err.d')}</p>
        {error.digest && <span className="sp-ref">{t('status.ref')}: <code>#{error.digest}</code></span>}
        <div className="sp-actions">
          <button type="button" onClick={reset} className="sp-btn">{t('status.retry')}</button>
          <Link href="/" className="sp-link">{t('status.home')}</Link>
        </div>
      </div>
    </main>
  );
}
