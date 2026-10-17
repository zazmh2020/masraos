'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import Icon from '@/components/Icon';
import { useT } from '@/lib/i18n/LocaleProvider';

/** تعيين كلمة مرور جديدة من رابط الاستعادة. يُزال الرمز من شريط العنوان فور قراءته. */
export default function ResetPasswordPage() {
  const t = useT();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const read = useRef(false);

  useEffect(() => {
    // مرة واحدة فقط: يشغّل React (Strict Mode) التأثير مرتين، وبعد الأولى يكون الرمز قد أُزيل من الرابط
    if (read.current) return;
    read.current = true;
    const value = new URL(window.location.href).searchParams.get('token') ?? '';
    // لا يبقى الرمز في سجل المتصفّح أو يُرسل في ترويسة Referer
    window.history.replaceState(null, '', '/reset-password');
    setToken(value);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError(t('reset.short')); return; }
    if (password !== confirm) { setError(t('reset.mismatch')); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
      });
      if (response.ok) setDone(true);
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
        <h1>{t('reset.title')}</h1>
        <p>{t('reset.sub')}</p>
      </div>

      {done ? (
        <>
          <div className="lg-notice" role="status"><Icon name="check" size={18} /><span>{t('reset.done')}</span></div>
          <Link href="/login" className="lg-submit">{t('reset.login')}</Link>
        </>
      ) : token === '' ? (
        <div className="lg-error" role="alert"><Icon name="alert" size={16} /><span>{t('reset.missing')}</span></div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="lg-error" role="alert"><Icon name="alert" size={16} /><span>{error}</span></div>
          )}
          <label className="lg-field">
            <span className="lg-label">{t('reset.password')}</span>
            <span className="lg-input-wrap">
              <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="lg-eye" onClick={() => setShowPw(!showPw)} aria-label={t(showPw ? 'login.hidePw' : 'login.showPw')} aria-pressed={showPw}>
                <Icon name={showPw ? 'hide' : 'view'} size={20} />
              </button>
            </span>
          </label>
          <label className="lg-field">
            <span className="lg-label">{t('reset.confirm')}</span>
            <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
          <button className="lg-submit" type="submit" disabled={busy || token === null}>{busy ? t('reset.saving') : t('reset.submit')}</button>
        </form>
      )}

      {!done && <p className="lg-switch"><Link href="/forgot-password">{t('forgot.title')}</Link></p>}
    </AuthShell>
  );
}
