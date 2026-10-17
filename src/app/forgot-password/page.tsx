'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

/** طلب رابط استعادة كلمة المرور — الرد واحد دائمًا فلا يكشف إن كان البريد مسجّلًا. */
export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!email.trim()) { setError(t('forgot.empty')); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      if (response.ok) setSent(true);
      else setError((await response.json().catch(() => ({}))).error ?? t('login.err.failed'));
    } catch {
      setError(t('login.err.network'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <div className="lg-head">
        <h1>{t('forgot.title')}</h1>
        <p>{t('forgot.sub')}</p>
      </div>

      {sent ? (
        <div className="lg-notice" role="status"><Icon name="mail" size={18} /><span>{t('forgot.sent')}</span></div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="lg-error" role="alert"><Icon name="alert" size={16} /><span>{error}</span></div>
          )}
          <label className="lg-field">
            <span className="lg-label">{t('login.email')}</span>
            <input type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button className="lg-submit" type="submit" disabled={busy}>{busy ? t('forgot.sending') : t('forgot.submit')}</button>
        </form>
      )}

      <p className="lg-switch"><Link href="/login">{t('forgot.back')}</Link></p>
    </AuthShell>
  );
}
