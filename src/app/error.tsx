'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // إبلاغ الخادم بالخطأ (مراقبة)
    fetch('/api/observe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: error.message, stack: error.stack, digest: error.digest, where: 'app/error' }),
    }).catch(() => {});
  }, [error]);

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: '2.4rem' }}>⚠️</div>
        <h1 style={h1}>حدث خطأ ما · Something went wrong</h1>
        <p style={p}>واجهنا مشكلة غير متوقّعة. حاول مرة أخرى.<br />An unexpected error occurred. Please try again.</p>
        {error.digest && <code style={code}>#{error.digest}</code>}
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.2rem' }}>
          <button onClick={reset} style={btnPrimary}>إعادة المحاولة · Retry</button>
          <Link href="/" style={btnGhost}>الرئيسية · Home</Link>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '2rem', fontFamily: "'Qomra', system-ui, sans-serif" };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #ececf0', borderRadius: 20, padding: '2.4rem', textAlign: 'center', maxWidth: 440, boxShadow: '0 20px 50px -30px rgba(23,21,28,0.4)' };
const h1: React.CSSProperties = { fontSize: '1.3rem', color: '#1a1820', margin: '0.8rem 0 0.5rem' };
const p: React.CSSProperties = { color: '#6a6874', lineHeight: 1.8, margin: 0 };
const code: React.CSSProperties = { display: 'inline-block', marginTop: '0.9rem', fontSize: '0.78rem', color: '#9a97a2', direction: 'ltr' };
const btnPrimary: React.CSSProperties = { flex: 1, padding: '0.65rem 1rem', borderRadius: 12, border: 'none', background: '#1a1820', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const btnGhost: React.CSSProperties = { flex: 1, padding: '0.65rem 1rem', borderRadius: 12, border: '1px solid #e4e3e8', background: 'transparent', color: '#1a1820', fontWeight: 700, textDecoration: 'none', display: 'grid', placeItems: 'center' };
