import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#61428C', letterSpacing: '0.05em' }}>404</div>
        <h1 style={h1}>الصفحة غير موجودة · Page not found</h1>
        <p style={p}>ربما تغيّر الرابط أو حُذفت الصفحة.<br />The page may have moved or been removed.</p>
        <Link href="/" style={btn}>العودة للرئيسية · Back home</Link>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: '70vh', display: 'grid', placeItems: 'center', padding: '2rem', fontFamily: "'Qomra', system-ui, sans-serif" };
const card: React.CSSProperties = { background: '#fff', border: '1px solid #ece9f4', borderRadius: 20, padding: '2.4rem', textAlign: 'center', maxWidth: 440, boxShadow: '0 20px 50px -30px rgba(43,26,78,0.4)' };
const h1: React.CSSProperties = { fontSize: '1.3rem', color: '#2b1a4e', margin: '0.8rem 0 0.5rem' };
const p: React.CSSProperties = { color: '#6c6780', lineHeight: 1.8, margin: '0 0 1.4rem' };
const btn: React.CSSProperties = { display: 'inline-block', padding: '0.65rem 1.6rem', borderRadius: 12, background: '#61428C', color: '#fff', fontWeight: 700, textDecoration: 'none' };
