'use client';

import { useEffect } from 'react';
import Icon from '@/components/Icon';
import './globals.css';
import '@/styles/status-page.css';

// يحلّ محل التخطيط الجذري عند تعطّله كليًا — لا مزوّد لغة هنا، لذا النص ثنائي اللغة عمدًا
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    fetch('/api/observe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest, where: 'app/global-error' }),
    }).catch(() => {});
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: 'var(--brand-primary-subtle)' }}>
        <main className="sp-page" style={{ minHeight: '100vh' }}>
          <div className="sp-box" role="alert">
            <span className="sp-icon" aria-hidden="true"><Icon name="alert" size={30} /></span>
            <h1>حدث خطأ غير متوقّع</h1>
            <p>واجهنا مشكلة أثناء تحميل مَسرى. حاول مرة أخرى.</p>
            <p lang="en" dir="ltr" style={{ marginTop: 8 }}>Something went wrong while loading Masra. Please try again.</p>
            {error.digest && <span className="sp-ref">Ref: <code>#{error.digest}</code></span>}
            <div className="sp-actions">
              <button type="button" onClick={reset} className="sp-btn">إعادة المحاولة · Try again</button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
