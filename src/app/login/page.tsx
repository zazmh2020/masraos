'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function LoginPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(t('login.err.empty'));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? t('login.err.failed'));
        setBusy(false);
        return;
      }
      window.location.href = data.redirectTo ?? window.location.origin;
    } catch {
      setError(t('login.err.network'));
      setBusy(false);
    }
  }

  return (
    <AuthShell>

      <div className="lg-head">
        <h1>{t('login.welcome')}</h1>
        <p>{t('login.sub')}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="lg-error" role="alert">
            <Icon name="alert" size={16} />
            <span>{error}</span>
          </div>
        )}

        <label className="lg-field">
          <span className="lg-label">{t('login.email')}</span>
          <input
            type="email" autoComplete="email" placeholder="name@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="lg-field">
          <span className="lg-label">{t('login.password')}</span>
          <span className="lg-input-wrap">
            <input
              type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} aria-label={t(showPw ? 'login.hidePw' : 'login.showPw')} aria-pressed={showPw}>
              <Icon name={showPw ? 'hide' : 'view'} size={20} />
            </button>
          </span>
        </label>

        <label className="lg-remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          {t('login.remember')}
        </label>

        <button className="lg-submit" type="submit" disabled={busy}>
          {busy ? t('login.submitting') : t('login.submit')}
          {!busy && <span className="au-arrow" aria-hidden="true">←</span>}
        </button>
      </form>

      <p className="lg-switch">{t('login.noAccount')} <Link href="/signup">{t('login.createAccount')}</Link></p>

    </AuthShell>
  );
}
