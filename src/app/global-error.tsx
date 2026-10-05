'use client';

import { useEffect } from 'react';

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
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f6f5fb', fontFamily: "'Qomra', system-ui, sans-serif" }}>
        <div style={{ background: '#fff', border: '1px solid #ece9f4', borderRadius: 20, padding: '2.4rem', textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: '2.4rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.3rem', color: '#2b1a4e', margin: '0.8rem 0 0.5rem' }}>حدث خطأ ما · Something went wrong</h1>
          <p style={{ color: '#6c6780', lineHeight: 1.8, margin: 0 }}>واجهنا مشكلة غير متوقّعة.<br />An unexpected error occurred.</p>
          {error.digest && <code style={{ display: 'inline-block', marginTop: '0.9rem', fontSize: '0.78rem', color: '#9a94ab', direction: 'ltr' }}>#{error.digest}</code>}
          <div style={{ marginTop: '1.2rem' }}>
            <button onClick={reset} style={{ padding: '0.65rem 1.4rem', borderRadius: 12, border: 'none', background: '#61428C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>إعادة المحاولة · Retry</button>
          </div>
        </div>
      </body>
    </html>
  );
}
